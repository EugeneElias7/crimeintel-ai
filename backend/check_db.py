import sqlite3

conn = sqlite3.connect('data/crimeintel.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for t in tables:
    print('Table:', t[0])
    cursor.execute(f'PRAGMA table_info({t[0]})')
    cols = cursor.fetchall()
    for c in cols:
        print(' ', c[1], ':', c[2])
    cursor.execute(f'SELECT COUNT(*) FROM {t[0]}')
    count = cursor.fetchone()[0]
    print('  Count:', count)
    print()
conn.close()