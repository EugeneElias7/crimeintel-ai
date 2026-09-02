from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class ConversationContext:
    """Structured conversation context for CRIMA."""
    active_cases: List[str] = field(default_factory=list)
    active_location: Optional[str] = None
    active_crime_type: Optional[str] = None
    active_person: Optional[str] = None
    active_date_range: Optional[tuple] = None
    active_filters: Dict[str, Any] = field(default_factory=dict)
    last_intent: Optional[str] = None
    last_results: List[Dict[str, Any]] = field(default_factory=list)
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)
    session_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class ConversationManager:
    """Manages conversation context and history for CRIMA."""
    
    def __init__(self, max_history: int = 10, max_context_cases: int = 5):
        self._contexts: Dict[str, ConversationContext] = {}
        self._max_history = max_history
        self._max_context_cases = max_context_cases
    
    def get_context(self, session_id: str) -> ConversationContext:
        """Get or create conversation context for session."""
        if session_id not in self._contexts:
            self._contexts[session_id] = ConversationContext()
        return self._contexts[session_id]
    
    def update_context(self, session_id: str, **kwargs) -> ConversationContext:
        """Update conversation context with new information."""
        context = self.get_context(session_id)
        for key, value in kwargs.items():
            if hasattr(context, key):
                setattr(context, key, value)
        context.updated_at = datetime.utcnow().isoformat()
        return context
    
    def add_to_history(self, session_id: str, role: str, text: str, 
                       metadata: Optional[Dict] = None) -> None:
        """Add message to conversation history."""
        context = self.get_context(session_id)
        entry = {
            "role": role,
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        context.conversation_history.append(entry)
        # Keep only recent history
        if len(context.conversation_history) > self._max_history * 2:
            context.conversation_history = context.conversation_history[-self._max_history * 2:]
    
    def add_case_to_context(self, session_id: str, case_id: str, 
                            metadata: Optional[Dict] = None) -> None:
        """Add case to active context."""
        context = self.get_context(session_id)
        if case_id not in context.active_cases:
            context.active_cases.append(case_id)
            if len(context.active_cases) > 5:
                context.active_cases = context.active_cases[-5:]
        
        if metadata:
            context.active_filters.update(metadata)
    
    def set_active_context(self, session_id: str, **kwargs) -> None:
        """Set active context filters."""
        context = self.get_context(session_id)
        for key in ['location', 'crime_type', 'person', 'date_range']:
            if key in kwargs and kwargs[key]:
                setattr(context, f"active_{key}", kwargs[key])
    
    def get_context_summary(self, session_id: str) -> Dict[str, Any]:
        """Get a summary of current conversation context for LLM."""
        context = self.get_context(session_id)
        return {
            "active_cases": context.active_cases,
            "active_location": context.active_location,
            "active_crime_type": context.active_crime_type,
            "active_person": context.active_person,
            "active_filters": context.active_filters,
            "last_intent": context.last_intent,
            "last_results": context.last_results,
            "recent_history": context.conversation_history[-5:] if context.conversation_history else []
        }

    def resolve_references(self, text: str, session_id: str) -> str:
        """Level 3: Resolve follow-up references like 'only open ones', 'show evidence', 'second one', 'compare them'."""
        ctx = self.get_context(session_id)
        lower = text.lower().strip()
        resolved = text

        # Replace pronouns "it", "that case", "this case", "them" with active_cases
        if ctx.active_cases:
            # "show evidence" -> evidence for last case
            if "show evidence" in lower or "evidence" in lower and "show" in lower:
                # keep as is, dispatcher will use active_cases
                pass
            # "second one", "first one", "third one" -> resolve to case_id by index
            import re
            ord_map = {"first": 0, "second": 1, "third": 2, "fourth": 3, "fifth": 4, "1st": 0, "2nd": 1, "3rd": 2}
            for word, idx in ord_map.items():
                if f"{word} one" in lower or f"{word} case" in lower:
                    if idx < len(ctx.active_cases):
                        resolved = resolved.replace(f"{word} one", ctx.active_cases[idx])
                        resolved = resolved.replace(f"{word} case", ctx.active_cases[idx])
            # pronoun "it" / "that" -> last active case
            if re.search(r"\bit\b|\bthat\b|\bthis\b", lower) and len(ctx.active_cases) >= 1:
                last_case = ctx.active_cases[-1]
                # only replace if no explicit case_id in text
                if not re.search(r"FIR-\d+-\d+", text):
                    # append hint for downstream
                    resolved = f"{resolved} [ref case {last_case}]"
            # "compare them" -> add active cases hint
            if "compare" in lower and ("them" in lower or "these" in lower):
                resolved = f"{resolved} [compare cases {', '.join(ctx.active_cases[:3])}]"
            # "only open ones" -> keep location/crime_type from context
            if "only open" in lower or "open ones" in lower:
                if ctx.active_filters or ctx.active_crime_type or ctx.active_location:
                    hint_parts = []
                    if ctx.active_crime_type:
                        hint_parts.append(f"crime_type={ctx.active_crime_type}")
                    if ctx.active_location:
                        hint_parts.append(f"location={ctx.active_location}")
                    hint_parts.extend([f"{k}={v}" for k, v in ctx.active_filters.items() if v])
                    resolved = f"{resolved} [context filters: {' '.join(hint_parts)} status=open]"
            # generic: if text is short follow-up without location, inject active_location
            if lower in ["only open ones", "show open", "filter open"] and ctx.active_location:
                resolved = f"{resolved} in {ctx.active_location}"
        return resolved

    def set_last_results(self, session_id: str, results: List[Dict[str, Any]]) -> None:
        ctx = self.get_context(session_id)
        ctx.last_results = results[:5] if results else []
        if results:
            # update active cases to top results
            ctx.active_cases = [(r.get("case_id") or r.get("ROWID")) for r in results[:5] if r.get("case_id") or r.get("ROWID")]
            # update active filters from first result
            first = results[0]
            if first.get("location"):
                ctx.active_location = first.get("location")
            if first.get("crime_type"):
                ctx.active_crime_type = first.get("crime_type")
            if first.get("status"):
                ctx.active_filters["status"] = first.get("status")
            if first.get("district"):
                ctx.active_filters["district"] = first.get("district")
        ctx.updated_at = datetime.utcnow().isoformat()
    
    def clear_session(self, session_id: str) -> None:
        """Clear session context."""
        if session_id in self._contexts:
            del self._contexts[session_id]
    
    def clear_all(self) -> None:
        """Clear all session contexts."""
        self._contexts.clear()


# Global conversation manager instance
conversation_manager = ConversationManager()