import os
from typing import Any

from adapters.sqlite_db import sqlite_db
from adapters.local_auth import local_auth

_catalyst_db = None
_catalyst_auth = None


def get_db_adapter() -> Any:
    """Get the appropriate database adapter based on environment."""
    use_catalyst = os.getenv("USE_CATALYST", "false").lower() == "true"

    global _catalyst_db
    if use_catalyst:
        if _catalyst_db is None:
            from adapters.catalyst_db import CatalystDBAdapter
            _catalyst_db = CatalystDBAdapter()
        return _catalyst_db

    return sqlite_db


def get_auth_adapter() -> Any:
    """Get the appropriate auth adapter based on environment."""
    use_catalyst = os.getenv("USE_CATALYST", "false").lower() == "true"

    global _catalyst_auth
    if use_catalyst:
        if _catalyst_auth is None:
            from adapters.catalyst_auth import CatalystAuthAdapter
            _catalyst_auth = CatalystAuthAdapter()
        return _catalyst_auth

    return local_auth


db = get_db_adapter()
auth = get_auth_adapter()