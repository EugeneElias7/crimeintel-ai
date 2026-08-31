import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
from abc import ABC, abstractmethod


class DocumentStorageService(ABC):
    @abstractmethod
    def save_document(
        self,
        user_id: int,
        file_content: bytes,
        original_filename: str,
        mime_type: str
    ) -> tuple[str, str, int]:
        """Save document and return (stored_filename, file_path, file_size)"""
        pass

    @abstractmethod
    def get_document_path(self, stored_filename: str) -> Optional[str]:
        """Get the full path to a stored document"""
        pass

    @abstractmethod
    def delete_document(self, stored_filename: str) -> bool:
        """Delete a stored document"""
        pass


class LocalStorageService(DocumentStorageService):
    def __init__(self, base_path: str = None):
        if base_path is None:
            base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "verification_documents")
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save_document(
        self,
        user_id: int,
        file_content: bytes,
        original_filename: str,
        mime_type: str
    ) -> tuple[str, str, int]:
        user_dir = self.base_path / f"user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)

        file_ext = Path(original_filename).suffix.lower()
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = user_dir / unique_filename

        with open(file_path, "wb") as f:
            f.write(file_content)

        file_size = len(file_content)
        return unique_filename, str(file_path), file_size

    def get_document_path(self, stored_filename: str) -> Optional[str]:
        for user_dir in self.base_path.iterdir():
            if user_dir.is_dir():
                file_path = user_dir / stored_filename
                if file_path.exists():
                    return str(file_path)
        return None

    def delete_document(self, stored_filename: str) -> bool:
        for user_dir in self.base_path.iterdir():
            if user_dir.is_dir():
                file_path = user_dir / stored_filename
                if file_path.exists():
                    file_path.unlink()
                    return True
        return False


def get_storage_service() -> DocumentStorageService:
    return LocalStorageService()