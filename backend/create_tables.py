import asyncio
from adapters.sqlite_db import sqlite_db

async def create_tables():
    await sqlite_db._ensure_initialized()
    # Create tables
    tables = [
        '''CREATE TABLE IF NOT EXISTS ci_Users (
            ROWID TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'officer',
            badge_number TEXT,
            phone TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )''',
        '''CREATE TABLE IF NOT EXISTS ci_Cases (
            ROWID TEXT PRIMARY KEY,
            case_id TEXT UNIQUE NOT NULL,
            fir_number TEXT UNIQUE NOT NULL,
            crime_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            date_filed TEXT NOT NULL,
            date_closed TEXT,
            location TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            district TEXT NOT NULL,
            description TEXT NOT NULL,
            officer_id TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'medium',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )''',
        '''CREATE TABLE IF NOT EXISTS ci_Suspects (
            ROWID TEXT PRIMARY KEY,
            suspect_id TEXT UNIQUE NOT NULL,
            case_id TEXT NOT NULL,
            name TEXT NOT NULL,
            alias TEXT,
            photo_url TEXT,
            age INTEGER,
            gender TEXT,
            address TEXT,
            identification_marks TEXT,
            known_associates TEXT,
            criminal_history TEXT,
            status TEXT NOT NULL DEFAULT 'wanted',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )''',
        '''CREATE TABLE IF NOT EXISTS ci_Witnesses (
            ROWID TEXT PRIMARY KEY,
            witness_id TEXT UNIQUE NOT NULL,
            case_id TEXT NOT NULL,
            name TEXT NOT NULL,
            contact TEXT,
            statement_summary TEXT,
            credibility_score REAL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )''',
        '''CREATE TABLE IF NOT EXISTS ci_Timeline (
            ROWID TEXT PRIMARY KEY,
            event_id TEXT UNIQUE NOT NULL,
            case_id TEXT NOT NULL,
            event_date TEXT NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            officer_id TEXT,
            created_at TEXT NOT NULL
        )''',
        '''CREATE TABLE IF NOT EXISTS ci_Evidence_Metadata (
            ROWID TEXT PRIMARY KEY,
            evidence_id TEXT UNIQUE NOT NULL,
            case_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_url TEXT NOT NULL,
            description TEXT,
            sensitive INTEGER NOT NULL DEFAULT 0,
            uploaded_by TEXT NOT NULL,
            uploaded_at TEXT NOT NULL
        )''',
        '''CREATE TABLE IF NOT EXISTS ci_Audit_Logs (
            ROWID TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            module TEXT NOT NULL,
            details TEXT,
            created_at TEXT NOT NULL
        )''',
        '''CREATE TABLE IF NOT EXISTS ci_System_Config (
            ROWID TEXT PRIMARY KEY,
            config_key TEXT UNIQUE NOT NULL,
            config_value TEXT NOT NULL,
            updated_by TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )''',
        '''CREATE TABLE IF NOT EXISTS ci_faiss_index_meta (
            ROWID TEXT PRIMARY KEY,
            index_path TEXT NOT NULL,
            dimension INTEGER NOT NULL,
            vector_count INTEGER NOT NULL,
            built_at TEXT NOT NULL,
            status TEXT NOT NULL
        )''',
    ]
    
    for sql in tables:
        try:
            sqlite_db._execute(sql)
            print(f'Created table')
        except Exception as e:
            print(f'Error: {e}')

asyncio.run(create_tables())