import asyncio
import logging
import time
from typing import Dict, List

from config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    def __init__(
        self, max_requests: int = None, window_seconds: int = 60
    ) -> None:
        self.max_requests = max_requests or settings.RATE_LIMIT_PER_MINUTE
        self.window_seconds = window_seconds
        self._entries: Dict[str, List[float]] = {}
        self._cleanup_task: asyncio.Task = None

    def _get_key(self, user_id: str) -> str:
        return user_id

    def check(self, user_id: str) -> bool:
        now = time.monotonic()
        key = self._get_key(user_id)
        timestamps = self._entries.get(key, [])
        timestamps = [t for t in timestamps if now - t < self.window_seconds]
        self._entries[key] = timestamps

        if len(timestamps) >= self.max_requests:
            return False

        timestamps.append(now)
        return True

    def get_remaining(self, user_id: str) -> int:
        now = time.monotonic()
        key = self._get_key(user_id)
        timestamps = self._entries.get(key, [])
        timestamps = [t for t in timestamps if now - t < self.window_seconds]
        self._entries[key] = timestamps
        return max(0, self.max_requests - len(timestamps))

    def get_window_seconds(self) -> int:
        return self.window_seconds

    async def _cleanup_expired(self) -> None:
        while True:
            await asyncio.sleep(60)
            now = time.monotonic()
            expired_keys = [
                key
                for key, timestamps in self._entries.items()
                if not [t for t in timestamps if now - t < self.window_seconds]
            ]
            for key in expired_keys:
                del self._entries[key]
            if expired_keys:
                logger.debug("Cleaned up %d expired rate limiter entries", len(expired_keys))

    def start_cleanup(self) -> None:
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_expired())

    async def stop_cleanup(self) -> None:
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass


rate_limiter = RateLimiter()
