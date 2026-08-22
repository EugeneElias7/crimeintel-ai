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
            "recent_history": context.conversation_history[-5:] if context.conversation_history else []
        }
    
    def clear_session(self, session_id: str) -> None:
        """Clear session context."""
        if session_id in self._contexts:
            del self._contexts[session_id]
    
    def clear_all(self) -> None:
        """Clear all session contexts."""
        self._contexts.clear()


# Global conversation manager instance
conversation_manager = ConversationManager()