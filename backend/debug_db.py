import sqlite3
conn = sqlite3.connect('data/crimeintel.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Check crime types in database
cur.execute('SELECT crime_type, COUNT(*) FROM ci_cases GROUP BY crime_type ORDER BY COUNT(*) DESC')
print('=== CRIME TYPES IN DATABASE ===')
for row in cur.fetchall():
    print(f'  {row[0]}: {row[1]}')

# Check date ranges
cur.execute('SELECT MIN(date_filed), MAX(date_filed) FROM ci_cases')
print('\n=== DATE RANGE ===')
print(cur.fetchone())

# Check homicide/murder cases
cur.execute('SELECT COUNT(*) FROM ci_cases WHERE crime_type = "murder"')
print('\nMurder cases:', cur.fetchone()[0])

# Check date range for murder cases
cur.execute('SELECT MIN(date_filed), MAX(date_filed) FROM ci_cases WHERE crime_type = "murder"')
print('Murder date range:', cur.fetchone())

# Check coordinate counts
cur.execute('SELECT COUNT(*) FROM ci_cases WHERE latitude IS NOT NULL AND longitude IS NOT NULL')
print('\nTotal cases with coordinates:', cur.fetchone()[0])

cur.execute('SELECT COUNT(*) FROM ci_cases WHERE crime_type = "murder" AND latitude IS NOT NULL AND longitude IS NOT NULL')
print('Murder cases with coordinates:', cur.fetchone()[0])

# Check date range format
cur.execute('SELECT date_filed FROM ci_cases LIMIT 5')
print('\nSample date_filed values:')
for row in cur.fetchall():
    print(f'  {row[0]}')

# Check districts
cur.execute('SELECT DISTINCT district FROM ci_cases ORDER BY district')
print('\n=== DISTRICTS ===')
for row in cur.fetchall():
    print(f'  {row[0]}')

# Check if homicide exists
cur.execute('SELECT COUNT(*) FROM ci_cases WHERE crime_type = "homicide"')
print('\nHomicide cases:', cur.fetchone()[0])

# Check date format more carefully
cur.execute('SELECT DISTINCT date_filed FROM ci_cases LIMIT 20')
print('\nSample date_filed values (distinct):')
for row in cur.fetchall():
    print(f'  {row[0]}')

conn.close()