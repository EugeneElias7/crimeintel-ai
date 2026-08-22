import logging
import os
import shutil
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


class LocalFSAdapter:
    def __init__(self, base_path: Optional[str] = None) -> None:
        self.base_path = base_path or os.path.join(os.path.dirname(__file__), "..", "storage", "evidence")
        os.makedirs(self.base_path, exist_ok=True)

    async def _ensure_initialized(self) -> None:
        pass

    async def upload_file(self, file, folder: str = "evidence") -> str:
        folder_path = os.path.join(self.base_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        file_path = os.path.join(folder_path, file.filename)
        file_content = await file.read()
        with open(file_path, "wb") as f:
            f.write(file_content)
        await file.seek(0)
        
        return f"file://{file_path}"

    async def delete_file(self, file_url: str) -> None:
        if file_url.startswith("file://"):
            file_path = file_url[7:]
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug("Deleted file: %s", file_path)

    async def get_file_url(self, file_url: str) -> str:
        return file_url


local_fs = LocalFSAdapter()