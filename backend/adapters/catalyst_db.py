import logging
from typing import Any, Dict, List, Optional

from config import settings

logger = logging.getLogger(__name__)


class CatalystDBAdapter:
    def __init__(self) -> None:
        self._initialized = False
        self._client = None
        self._datastore = None
        self._table_prefix = settings.DATA_STORE_TABLE_PREFIX

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
                self._datastore = self._client.datastore()
                self._initialized = True
                logger.info("CatalystDBAdapter initialized successfully")
            except Exception as e:
                logger.error("Failed to initialize CatalystDBAdapter: %s", e)
                raise

    def _prefixed(self, table: str) -> str:
        return f"{self._table_prefix}{table}"

    async def get(self, table: str, row_id: str) -> Optional[dict]:
        try:
            await self._ensure_initialized()
            table_instance = self._datastore.table(self._prefixed(table))
            result = table_instance.get_row(row_id)
            if result:
                return dict(result)
            return None
        except Exception as e:
            logger.error("CatalystDB get failed for %s/%s: %s", table, row_id, e)
            raise

    async def insert(self, table: str, data: dict) -> str:
        try:
            await self._ensure_initialized()
            table_instance = self._datastore.table(self._prefixed(table))
            result = table_instance.insert_row(data)
            row_id = result.get("ROWID") or result.get("row_id") or str(result)
            logger.debug("Inserted row into %s with ROWID: %s", self._prefixed(table), row_id)
            return str(row_id)
        except Exception as e:
            logger.error("CatalystDB insert failed for %s: %s", table, e)
            raise

    async def update(self, table: str, row_id: str, data: dict) -> None:
        try:
            await self._ensure_initialized()
            table_instance = self._datastore.table(self._prefixed(table))
            table_instance.update_row(row_id, data)
            logger.debug("Updated row %s in %s", row_id, self._prefixed(table))
        except Exception as e:
            logger.error("CatalystDB update failed for %s/%s: %s", table, row_id, e)
            raise

    async def delete(self, table: str, row_id: str) -> None:
        try:
            await self._ensure_initialized()
            table_instance = self._datastore.table(self._prefixed(table))
            table_instance.delete_row(row_id)
            logger.debug("Deleted row %s from %s", row_id, self._prefixed(table))
        except Exception as e:
            logger.error("CatalystDB delete failed for %s/%s: %s", table, row_id, e)
            raise

    async def get_all(self, table: str) -> List[dict]:
        try:
            await self._ensure_initialized()
            table_instance = self._datastore.table(self._prefixed(table))
            result = table_instance.get_all_rows()
            return [dict(row) for row in (result or [])]
        except Exception as e:
            logger.error("CatalystDB get_all failed for %s: %s", table, e)
            raise

    async def query(self, table: str, filters: dict) -> List[dict]:
        try:
            await self._ensure_initialized()
            table_instance = self._datastore.table(self._prefixed(table))

            all_rows = table_instance.get_all_rows()
            if not all_rows:
                return []

            filtered = []
            for row in all_rows:
                row_dict = dict(row)
                match = True
                for key, value in filters.items():
                    if key not in row_dict or row_dict[key] != value:
                        match = False
                        break
                if match:
                    filtered.append(row_dict)

            return filtered
        except Exception as e:
            logger.error("CatalystDB query failed for %s: %s", table, e)
            raise

    async def get_table_meta(self, table: str) -> Optional[dict]:
        try:
            await self._ensure_initialized()
            table_instance = self._datastore.table(self._prefixed(table))
            return table_instance.get_meta()
        except Exception as e:
            logger.error("CatalystDB get_table_meta failed for %s: %s", table, e)
            return None


catalyst_db = CatalystDBAdapter()
