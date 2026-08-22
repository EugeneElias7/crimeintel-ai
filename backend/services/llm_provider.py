import logging
import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    answer: str
    provider: str
    model: str
    metadata: Dict[str, Any]


class LLMProvider(ABC):
    @abstractmethod
    async def initialize(self) -> bool:
        pass

    @abstractmethod
    async def generate(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> LLMResponse:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def model(self) -> str:
        pass


class GroundedFallbackProvider(LLMProvider):
    def __init__(self) -> None:
        self._initialized = True

    async def initialize(self) -> bool:
        return True

    def is_available(self) -> bool:
        return True

    @property
    def name(self) -> str:
        return "grounded_fallback"

    @property
    def model(self) -> str:
        return "template"

    async def generate(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> LLMResponse:
        if not context_records:
            return LLMResponse(
                answer="Insufficient information was found in the available crime database.",
                provider=self.name,
                model=self.model,
                metadata={"fallback": True, "reason": "no_context"},
            )

        case_ids = [r.get("case_id", "Unknown") for r in context_records[:5]]
        crime_types = list(set(r.get("crime_type", "Unknown") for r in context_records))
        locations = list(set(r.get("location", "Unknown") for r in context_records))

        if intent == "case_detail" and entities.get("case_id"):
            case_id = entities["case_id"]
            matching = [r for r in context_records if r.get("case_id") == case_id]
            if matching:
                r = matching[0]
                answer = (
                    f"Case {r.get('case_id', case_id)}: {r.get('crime_type', 'Unknown')} "
                    f"at {r.get('location', 'Unknown')}, {r.get('district', 'Unknown')}. "
                    f"Status: {r.get('status', 'Unknown')}. "
                    f"Filed on: {r.get('date_filed', 'Unknown')}. "
                    f"Description: {r.get('description', 'No description available.')[:300]}"
                )
                return LLMResponse(
                    answer=answer,
                    provider=self.name,
                    model=self.model,
                    metadata={"fallback": True, "case_id": case_id},
                )
            return LLMResponse(
                answer=f"Case {case_id} was not found in the retrieved records.",
                provider=self.name,
                model=self.model,
                metadata={"fallback": True},
            )

        if intent == "statistics":
            total = len(context_records)
            open_count = sum(1 for r in context_records if r.get("status") in ["open", "under_investigation"])
            closed_count = sum(1 for r in context_records if r.get("status") == "closed")
            answer = (
                f"Based on {total} retrieved cases: "
                f"{open_count} open, {closed_count} closed. "
                f"Crime types: {', '.join(crime_types[:5])}. "
                f"Locations: {', '.join(locations[:5])}."
            )
            return LLMResponse(
                answer=answer,
                provider=self.name,
                model=self.model,
                metadata={"fallback": True, "total_cases": total},
            )

        if intent in ["case_search", "location_query", "cross_reference"]:
            answer = (
                f"Found {len(context_records)} relevant case(s) for your query. "
                f"Case IDs: {', '.join(case_ids)}. "
                f"Crime types: {', '.join(crime_types[:5])}. "
                f"Locations: {', '.join(locations[:5])}."
            )
            return LLMResponse(
                answer=answer,
                provider=self.name,
                model=self.model,
                metadata={"fallback": True, "total_cases": len(context_records)},
            )

        answer = (
            f"Retrieved {len(context_records)} case(s) related to your query. "
            f"Case IDs: {', '.join(case_ids)}."
        )
        return LLMResponse(
            answer=answer,
            provider=self.name,
            model=self.model,
            metadata={"fallback": True},
        )


class QwenLocalProvider(LLMProvider):
    def __init__(self) -> None:
        self._initialized = False
        self._client = None
        self._model_name = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:1.5b")
        self._host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11435")

    async def initialize(self) -> bool:
        if self._initialized:
            return True
        try:
            import ollama
            self._client = ollama.AsyncClient(host=self._host)
            await self._client.ps()
            self._initialized = True
            logger.info("QwenLocalProvider initialized successfully with Ollama at %s", self._host)
            return True
        except Exception as e:
            logger.warning("QwenLocalProvider initialization failed: %s", e)
            self._initialized = False
            return False

    def is_available(self) -> bool:
        return self._initialized

    @property
    def name(self) -> str:
        return "qwen_local"

    @property
    def model(self) -> str:
        return self._model_name

    async def generate(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> LLMResponse:
        await self.initialize()
        if not self._initialized or not self._client:
            return LLMResponse(
                answer="",
                provider=self.name,
                model=self.model,
                metadata={"error": "not_initialized"},
            )

        if not context_records:
            return LLMResponse(
                answer="Insufficient information was found in the available crime database.",
                provider=self.name,
                model=self.model,
                metadata={"fallback": True, "reason": "no_context"},
            )

        context_text = self._build_context(context_records)
        prompt = self._build_prompt(query, context_text, intent, entities)

        try:
            response = await self._client.generate(
                model=self._model_name,
                prompt=prompt,
                options={
                    "temperature": 0.1,
                    "num_predict": 1024,
                    "think": False,
                },
                keep_alive=0,
            )
            answer = response.get("response", "").strip()
            if not answer:
                thinking = response.get("thinking", "").strip()
                if thinking:
                    answer = thinking
                else:
                    raise ValueError("Empty response from Qwen")
            return LLMResponse(
                answer=answer,
                provider=self.name,
                model=self.model,
                metadata={"fallback": False},
            )
        except Exception as e:
            logger.error("Qwen generation failed: %s", e)
            return LLMResponse(
                answer="",
                provider=self.name,
                model=self.model,
                metadata={"error": str(e)},
            )

    def _build_context(self, records: List[Dict[str, Any]]) -> str:
        parts = []
        for i, record in enumerate(records, 1):
            case_id = record.get("case_id", "Unknown")
            crime_type = record.get("crime_type", "Unknown")
            location = record.get("location", "Unknown")
            district = record.get("district", "Unknown")
            status = record.get("status", "Unknown")
            date_filed = record.get("date_filed", "Unknown")
            description = record.get("description", "")
            summary = record.get("summary", "")

            part = f"[Case {i}]\n"
            part += f"Case ID: {case_id}\n"
            part += f"Crime Type: {crime_type}\n"
            part += f"Location: {location}, {district}\n"
            part += f"Date Filed: {date_filed}\n"
            part += f"Status: {status}\n"
            if description:
                part += f"Description: {description[:500]}\n"
            if summary:
                part += f"Summary: {summary}\n"
            parts.append(part)
        return "\n".join(parts)

    def _build_prompt(
        self,
        query: str,
        context_text: str,
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        return f"""You are CRIMA, the Crime Intelligence AI Assistant for Karnataka State Police.

USER QUERY: "{query}"
DETECTED INTENT: {intent}
ENTITIES: {entities}

RETRIEVED CASE RECORDS FROM DATABASE:
{context_text}

INSTRUCTIONS:
1. Answer the user's query using ONLY the retrieved case records above.
2. DO NOT invent or hallucinate any case details, case IDs, or statistics not present in the retrieved records.
3. If the retrieved records do not contain sufficient information to answer the query, respond with: "Insufficient information was found in the available crime database."
4. Always cite relevant Case IDs from the retrieved records when providing information.
5. For statistics queries, calculate from the retrieved records only.
6. Be concise, professional, and factual.
7. If multiple cases are relevant, summarize the key patterns.

YOUR RESPONSE:"""


class GeminiProvider(LLMProvider):
    def __init__(self) -> None:
        self._initialized = False
        self._client = None
        self._api_key = ""
        self._model_name = "gemini-2.5-flash"

    async def initialize(self) -> bool:
        if self._initialized:
            return True
        try:
            import os
            import certifi
            import requests
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry

            self._api_key = os.getenv("GEMINI_API_KEY", "")
            if not self._api_key or self._api_key == "your_gemini_api_key_here":
                logger.warning("GEMINI_API_KEY not set")
                self._initialized = False
                return False

            self._session = requests.Session()
            self._session.verify = certifi.where()
            retry = Retry(total=3, backoff_factor=0.5)
            adapter = HTTPAdapter(max_retries=retry)
            self._session.mount("https://", adapter)
            self._api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model_name}:generateContent"
            self._initialized = True
            logger.info("GeminiProvider initialized successfully")
            return True
        except Exception as e:
            logger.error("GeminiProvider initialization failed: %s", e)
            self._initialized = False
            return False

    def is_available(self) -> bool:
        return self._initialized

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def model(self) -> str:
        return self._model_name

    async def generate(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> LLMResponse:
        await self.initialize()
        if not self._initialized:
            return LLMResponse(
                answer="",
                provider=self.name,
                model=self.model,
                metadata={"error": "not_initialized"},
            )

        if not context_records:
            return LLMResponse(
                answer="Insufficient information was found in the available crime database.",
                provider=self.name,
                model=self.model,
                metadata={"fallback": True, "reason": "no_context"},
            )

        context_text = self._build_context(context_records)
        prompt = self._build_prompt(query, context_text, intent, entities)

        try:
            headers = {
                "x-goog-api-key": self._api_key,
                "Content-Type": "application/json",
            }
            data = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024},
            }
            response = self._session.post(self._api_url, headers=headers, json=data, timeout=30)
            if response.status_code == 200:
                result = response.json()
                answer = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                return LLMResponse(
                    answer=answer,
                    provider=self.name,
                    model=self.model,
                    metadata={"fallback": False},
                )
            else:
                logger.error("Gemini API error: %s", response.text)
                return LLMResponse(
                    answer="",
                    provider=self.name,
                    model=self.model,
                    metadata={"error": response.text},
                )
        except Exception as e:
            logger.error("Gemini generation failed: %s", e)
            return LLMResponse(
                answer="",
                provider=self.name,
                model=self.model,
                metadata={"error": str(e)},
            )

    def _build_context(self, records: List[Dict[str, Any]]) -> str:
        parts = []
        for i, record in enumerate(records, 1):
            case_id = record.get("case_id", "Unknown")
            crime_type = record.get("crime_type", "Unknown")
            location = record.get("location", "Unknown")
            district = record.get("district", "Unknown")
            status = record.get("status", "Unknown")
            date_filed = record.get("date_filed", "Unknown")
            description = record.get("description", "")
            summary = record.get("summary", "")

            part = f"[Case {i}]\n"
            part += f"Case ID: {case_id}\n"
            part += f"Crime Type: {crime_type}\n"
            part += f"Location: {location}, {district}\n"
            part += f"Date Filed: {date_filed}\n"
            part += f"Status: {status}\n"
            if description:
                part += f"Description: {description[:500]}\n"
            if summary:
                part += f"Summary: {summary}\n"
            parts.append(part)
        return "\n".join(parts)

    def _build_prompt(
        self,
        query: str,
        context_text: str,
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        return f"""You are CRIMA, the Crime Intelligence AI Assistant for Karnataka State Police.

USER QUERY: "{query}"
DETECTED INTENT: {intent}
ENTITIES: {entities}

RETRIEVED CASE RECORDS FROM DATABASE:
{context_text}

INSTRUCTIONS:
1. Answer the user's query using ONLY the retrieved case records above.
2. DO NOT invent or hallucinate any case details, case IDs, or statistics not present in the retrieved records.
3. If the retrieved records do not contain sufficient information to answer the query, respond with: "Insufficient information was found in the available crime database."
4. Always cite relevant Case IDs from the retrieved records when providing information.
5. For statistics queries, calculate from the retrieved records only.
6. Be concise, professional, and factual.
7. If multiple cases are relevant, summarize the key patterns.

YOUR RESPONSE:"""


class LLMProviderFactory:
    _providers: Dict[str, LLMProvider] = {}

    @classmethod
    def get_provider(cls, name: str) -> LLMProvider:
        if name not in cls._providers:
            if name == "qwen":
                cls._providers[name] = QwenLocalProvider()
            elif name == "gemini":
                cls._providers[name] = GeminiProvider()
            elif name == "fallback":
                cls._providers[name] = GroundedFallbackProvider()
            else:
                raise ValueError(f"Unknown provider: {name}")
        return cls._providers[name]

    @classmethod
    async def get_primary(cls) -> LLMProvider:
        import os
        provider_name = os.getenv("LLM_PROVIDER", "qwen").lower()
        provider = cls.get_provider(provider_name)
        if await provider.initialize():
            return provider
        logger.warning("Primary provider %s unavailable, trying fallback", provider_name)
        fallback = cls.get_provider("fallback")
        await fallback.initialize()
        return fallback

    @classmethod
    async def generate_with_fallback(
        cls,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> LLMResponse:
        primary = await cls.get_primary()
        result = await primary.generate(query, context_records, intent, entities)
        if result.answer and not result.metadata.get("error"):
            return result

        logger.warning("Primary provider %s failed, using fallback", primary.name)
        fallback = cls.get_provider("fallback")
        await fallback.initialize()
        return await fallback.generate(query, context_records, intent, entities)