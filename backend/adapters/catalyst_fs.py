import logging
import uuid
from typing import Optional

from fastapi import UploadFile

from config import settings

logger = logging.getLogger(__name__)


class CatalystFSAdapter:
    def __init__(self) -> None:
        self._initialized = False
        self._client = None
        self._filestore = None

    async def _ensure_initialized(self) -> None:
        if not self._initialized:
            try:
                from catalyst_sdk import CatalystApp

                self._client = CatalystApp.initialize(
                    {
                        "project_id": settings.CATALYST_PROJECT_ID,
                        "client_id": settings.CATALYST_CLIENT_ID,
                        "client_secret": settings.CATALYST_CLIENT_SECRET,
                    }
                )
                self._filestore = self._client.filestore()
                self._initialized = True
                logger.info("CatalystFSAdapter initialized successfully")
            except Exception as e:
                logger.error("Failed to initialize CatalystFSAdapter: %s", e)
                raise

    async def upload_file(
        self, file: UploadFile, folder: str = "evidence"
    ) -> str:
        try:
            await self._ensure_initialized()

            original_filename = file.filename or "unknown"
            ext = ""
            if "." in original_filename:
                ext = original_filename.rsplit(".", 1)[1]
                ext = f".{ext}"

            unique_filename = f"{uuid.uuid4().hex}{ext}"
            file_path = f"{folder}/{unique_filename}" if folder else unique_filename

            content = await file.read()
            folder_instance = self._filestore.folder(folder)
            result = folder_instance.upload_file(file_path, content)

            file_url = result.get("file_url") or result.get("url") or ""
            logger.debug(
                "Uploaded file %s to %s, URL: %s",
                original_filename,
                file_path,
                file_url,
            )
            return file_url
        except Exception as e:
            logger.error(
                "CatalystFS upload failed for %s: %s",
                getattr(file, "filename", "unknown"),
                e,
            )
            raise

    async def delete_file(self, file_url: str) -> None:
        try:
            await self._ensure_initialized()
            file_path = self._extract_path_from_url(file_url)
            if not file_path:
                logger.warning("Could not extract file path from URL: %s", file_url)
                return
            self._filestore.delete_file(file_path)
            logger.debug("Deleted file: %s", file_path)
        except Exception as e:
            logger.error("CatalystFS delete failed for %s: %s", file_url, e)
            raise

    async def get_file_url(self, file_path: str) -> Optional[str]:
        try:
            await self._ensure_initialized()
            result = self._filestore.get_file(file_path)
            return result.get("file_url") if result else None
        except Exception as e:
            logger.error("CatalystFS get_file_url failed for %s: %s", file_path, e)
            return None

    @staticmethod
    def _extract_path_from_url(file_url: str) -> Optional[str]:
        import re

        patterns = [
            r"/api/v1/filestore/(.+?)(?:\?|$)",
            r"/filestore/(.+?)(?:\?|$)",
            r"/(evidence/\w+\.\w+)(?:\?|$)",
        ]
        for pattern in patterns:
            match = re.search(pattern, file_url)
            if match:
                return match.group(1)
        return None


catalyst_fs = CatalystFSAdapter()
