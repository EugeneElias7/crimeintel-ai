import logging
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

from config import settings

logger = logging.getLogger(__name__)


class SQLiteDBAdapter:
    def __init__(self) -> None:
        self._initialized = False
        self._conn = None
        self._table_prefix = settings.DATA_STORE_TABLE_PREFIX
        self._db_path = Path(__file__).parent.parent / "data" / "crimeintel.db"

    async def _ensure_initialized(self) -> None:
        if not self._initialized:
            try:
                self._conn = sqlite3.connect(str(self._db_path), check_same_thread=False)
                self._conn.row_factory = sqlite3.Row
                self._initialized = True
                logger.info("SQLiteDBAdapter initialized successfully at %s", self._db_path)
            except Exception as e:
                logger.error("Failed to initialize SQLiteDBAdapter: %s", e)
                raise

    def _prefixed(self, table: str) -> str:
        return f"{self._table_prefix}{table}"

    def _execute(self, query: str, params: tuple = ()) -> sqlite3.Cursor:
        if not self._conn:
            raise RuntimeError("Database not initialized")
        cursor = self._conn.cursor()
        return cursor.execute(query, params)

    def _fetchone(self, query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        cursor = self._execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None

    def _fetchall(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        cursor = self._execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

    async def get(self, table: str, row_id: str) -> Optional[dict]:
        try:
            await self._ensure_initialized()
            table_name = self._prefixed(table)
            result = self._fetchone(f"SELECT * FROM {table_name} WHERE ROWID = ?", (row_id,))
            if result:
                return result
            return None
        except Exception as e:
            logger.error("SQLite get failed for %s/%s: %s", table, row_id, e)
            raise

    async def insert(self, table: str, data: dict) -> str:
        try:
            await self._ensure_initialized()
            table_name = self._prefixed(table)
            
            if "ROWID" in data:
                row_id = data["ROWID"]
                columns = [k for k in data.keys() if k != "ROWID"]
                values = [data[k] for k in columns]
                placeholders = ", ".join(["?"] * len(columns))
                cols = ", ".join(columns)
                self._execute(
                    f"INSERT INTO {table_name} (ROWID, {cols}) VALUES (?, {placeholders})",
                    (row_id, *values)
                )
            else:
                columns = list(data.keys())
                values = list(data.values())
                placeholders = ", ".join(["?"] * len(columns))
                cols = ", ".join(columns)
                cursor = self._execute(
                    f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders})",
                    values
                )
                row_id = str(cursor.lastrowid)
            
            self._conn.commit()
            logger.debug("Inserted row into %s with ROWID: %s", table_name, row_id)
            return row_id
        except Exception as e:
            logger.error("SQLite insert failed for %s: %s", table, e)
            raise

    async def update(self, table: str, row_id: str, data: dict) -> None:
        try:
            await self._ensure_initialized()
            table_name = self._prefixed(table)
            
            columns = list(data.keys())
            values = list(data.values())
            set_clause = ", ".join([f"{col} = ?" for col in columns])
            
            self._execute(
                f"UPDATE {table_name} SET {set_clause} WHERE ROWID = ?",
                (*values, row_id)
            )
            self._conn.commit()
            logger.debug("Updated row %s in %s", row_id, table_name)
        except Exception as e:
            logger.error("SQLite update failed for %s/%s: %s", table, row_id, e)
            raise

    async def delete(self, table: str, row_id: str) -> None:
        try:
            await self._ensure_initialized()
            table_name = self._prefixed(table)
            
            self._execute(f"DELETE FROM {table_name} WHERE ROWID = ?", (row_id,))
            self._conn.commit()
            logger.debug("Deleted row %s from %s", row_id, table_name)
        except Exception as e:
            logger.error("SQLite delete failed for %s/%s: %s", table, row_id, e)
            raise

    async def get_all(self, table: str) -> List[dict]:
        try:
            await self._ensure_initialized()
            table_name = self._prefixed(table)
            return self._fetchall(f"SELECT * FROM {table_name}")
        except Exception as e:
            logger.error("SQLite get_all failed for %s: %s", table, e)
            raise

    async def query(self, table: str, filters: dict) -> List[dict]:
        try:
            await self._ensure_initialized()
            table_name = self._prefixed(table)
            
            if not filters:
                return self._fetchall(f"SELECT * FROM {table_name}")
            
            where_clauses = []
            params = []
            for key, value in filters.items():
                where_clauses.append(f"{key} = ?")
                params.append(value)
            
            where_clause = " AND ".join(where_clauses)
            return self._fetchall(f"SELECT * FROM {table_name} WHERE {where_clause}", tuple(params))
        except Exception as e:
            logger.error("SQLite query failed for %s: %s", table, e)
            raise

    async def get_table_meta(self, table: str) -> Optional[dict]:
        try:
            await self._ensure_initialized()
            table_name = self._prefixed(table)
            cursor = self._conn.cursor()
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [dict(row) for row in cursor.fetchall()]
            return {"columns": columns} if columns else None
        except Exception as e:
            logger.error("SQLite get_table_meta failed for %s: %s", table, e)
            return None


sqlite_db = SQLiteDBAdapter()