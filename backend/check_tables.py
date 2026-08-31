import sqlite3
conn = sqlite3.connect('crimeintel.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = cursor.fetchall()
for t in tables:
    print('Table:', t[0])
    cursor.execute('PRAGMA table_info(' + t[0] + ')')
    columns = cursor.fetchall()
    for col in columns:
        print('  ', col[1], '(', col[2], ')')
print('Done')