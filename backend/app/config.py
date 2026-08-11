"""Environment-driven configuration.

Local-first defaults matching `.env.example`. Provider keys (DATABASE__PROVIDER,
STORAGE__PROVIDER, AUTH__PROVIDER, AI__PROVIDER) select adapter implementations —
see docs/ARCHITECTURE.md §8.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _env(name: str, default: str) -> str:
    return os.getenv(name, default)


def _abs(path: str) -> str:
    """Resolve a configured path against the repo root; Windows-safe.

    Bare paths (storage/...) resolve to repo-relative; sqlite:/// URLs have
    their file part resolved the same way.
    """
    if ":///" in path:
        prefix, rest = path.split(":///", 1)
        p = Path(rest)
        resolved = p if p.is_absolute() else (REPO_ROOT / p)
        return f"{prefix}:///{resolved}".replace("\\", "/")
    p = Path(path)
    resolved = p if p.is_absolute() else (REPO_ROOT / p)
    return str(resolved).replace("\\", "/")


@dataclass(frozen=True)
class Settings:
    app_name: str = field(default_factory=lambda: _env("APP_NAME", "CrimeIntel AI"))
    app_env: str = field(default_factory=lambda: _env("APP_ENV", "development"))
    log_level: str = field(default_factory=lambda: _env("LOG_LEVEL", "INFO"))

    database_provider: str = field(default_factory=lambda: _env("DATABASE__PROVIDER", "sqlite"))
    database_url: str = field(
        default_factory=lambda: _abs(_env("DATABASE__URL", "sqlite:///data/crimeintel.db"))
    )

    storage_provider: str = field(default_factory=lambda: _env("STORAGE__PROVIDER", "local"))
    storage_root: str = field(default_factory=lambda: _abs(_env("STORAGE__ROOT", "storage")))
    max_upload_mb: int = field(default_factory=lambda: int(_env("MAX_UPLOAD_MB", "25")))

    auth_provider: str = field(default_factory=lambda: _env("AUTH__PROVIDER", "local"))
    auth_jwt_secret: str = field(
        default_factory=lambda: _env("AUTH__JWT_SECRET", "change-me-to-a-long-random-string")
    )
    auth_access_token_minutes: int = field(default_factory=lambda: int(_env("AUTH__ACCESS_TOKEN_MINUTES", "15")))
    auth_refresh_token_days: int = field(default_factory=lambda: int(_env("AUTH__REFRESH_TOKEN_DAYS", "7")))

    ai_provider: str = field(default_factory=lambda: _env("AI__PROVIDER", "local"))
    ai_embedding_model: str = field(
        default_factory=lambda: _env("AI__EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    )
    ai_faiss_index: str = field(
        default_factory=lambda: _abs(_env("AI__FAISS_INDEX", "data/indexes/cases.index"))
    )
    ai_top_k: int = field(default_factory=lambda: int(_env("AI__TOP_K", "20")))
    ai_answer_timeout_seconds: int = field(default_factory=lambda: int(_env("AI__ANSWER_TIMEOUT_SECONDS", "10")))
    ai_llm_url: str = field(default_factory=lambda: _env("AI__LLM_URL", ""))

    cors_origins: str = field(default_factory=lambda: _env("CORS_ORIGINS", "http://localhost:5173"))
    rate_limit_crima_per_minute: int = field(
        default_factory=lambda: int(_env("RATE_LIMIT_CRIMA_PER_MINUTE", "20"))
    )


settings = Settings()