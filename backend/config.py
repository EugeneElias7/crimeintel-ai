import os
from typing import List

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


class Settings:
    CATALYST_PROJECT_ID: str = os.getenv("CATALYST_PROJECT_ID", "")
    CATALYST_CLIENT_ID: str = os.getenv("CATALYST_CLIENT_ID", "")
    CATALYST_CLIENT_SECRET: str = os.getenv("CATALYST_CLIENT_SECRET", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_EXPIRY_MINUTES: int = int(os.getenv("JWT_EXPIRY_MINUTES", "60"))
    JWT_ALGORITHM: str = "HS256"

    ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5175,http://localhost:5173,http://localhost:3000",
        ).split(",")
        if origin.strip()
    ]

    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    DATA_STORE_TABLE_PREFIX: str = os.getenv("DATA_STORE_TABLE_PREFIX", "ci_")

    FAISS_INDEX_DIMENSION: int = 384
    FAISS_INDEX_PATH: str = os.path.join(os.path.dirname(__file__), "data", "faiss_index.bin")

    # Max file upload size in bytes
    @property
    def MAX_UPLOAD_SIZE_BYTES(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # Allowed file extensions for evidence uploads
    ALLOWED_EXTENSIONS: set = {".pdf", ".jpg", ".jpeg", ".png", ".mp4"}


settings = Settings()
