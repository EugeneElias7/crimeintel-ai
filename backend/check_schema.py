import sqlite3
conn = sqlite3.connect('data/crimeintel.db')
cursor = conn.cursor()
# Check all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()
for t in tables:
    table_name = t[0]
    cursor.execute(f'PRAGMA table_info({table_name})')
    columns = cursor.fetchall()
    print(f"\nTable: {table_name}")
    for c in columns:
        print(f"  {c[1]} ({c[2]})")
conn.close()