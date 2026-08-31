import logging
import os
import shutil
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


class LocalFSAdapter:
    def __init__(self, base_path: Optional[str] = None) -> None:
        self.base_path = base_path or os.path.join(os.path.dirname(__file__), "..", "storage")
        os.makedirs(self.base_path, exist_ok=True)
        os.makedirs(os.path.join(self.base_path, "evidence"), exist_ok=True)
        os.makedirs(os.path.join(self.base_path, "cases"), exist_ok=True)

    async def _ensure_initialized(self) -> None:
        pass

    async def upload_file(self, file, folder: str = "evidence") -> str:
        # Handle per-case path like "cases/{case_id}/evidence" - sanitize each segment
        parts = folder.replace("\\", "/").split("/")
        safe_parts = []
        for p in parts:
            safe = "".join(c for c in p if c.isalnum() or c in ("-", "_")).strip()
            if safe:
                safe_parts.append(safe)
        safe_folder = os.path.join(*safe_parts) if safe_parts else "evidence"
        folder_path = os.path.join(self.base_path, safe_folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Sanitize filename: keep alnum, dot, dash, underscore, generate safe name
        orig = file.filename or "file"
        # Remove path traversal
        orig = os.path.basename(orig)
        name, ext = os.path.splitext(orig)
        safe_name = "".join(c for c in name if c.isalnum() or c in ("-", "_")).strip() or "evidence"
        # Generate safe filename with uuid to avoid collision
        import uuid as _uuid, time as _time
        safe_filename = f"{_uuid.uuid4().hex[:8]}_{int(_time.time())}{ext.lower()}"
        # Fallback if original had no ext but safe ext derived from mime?
        if not safe_filename.endswith(ext.lower()) and ext:
            safe_filename = safe_filename
        file_path = os.path.join(folder_path, safe_filename)
        # Preserve original name in metadata, but store safe file on disk
        # Also handle duplicate original name logging
        file_content = await file.read()
        with open(file_path, "wb") as f:
            f.write(file_content)
        await file.seek(0)
        
        logger.info(f"Stored evidence {orig} as {safe_filename} in {folder_path} for case {safe_folder}")
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