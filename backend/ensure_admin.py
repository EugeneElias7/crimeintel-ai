import asyncio, hashlib, sqlite3, pathlib, datetime

# ensure data dir exists
db_path = pathlib.Path(__file__).parent / "data" / "crimeintel.db"
print("DB:", db_path, "exists:", db_path.exists())

# check tables
con = sqlite3.connect(str(db_path))
cur = con.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print(cur.fetchall())
# ensure ci_Users exists
cur.execute("PRAGMA table_info(ci_Users)")
cols = cur.fetchall()
print("ci_Users cols:", cols[:10])

# ensure admin exists with sha256 hash (local_auth)
def sha(p): return hashlib.sha256(p.encode()).hexdigest()

admin_email = "admin@ksp.gov.in"
admin_pass = "AdminPass123"
admin_hash = sha(admin_pass)
print("hash:", admin_hash[:16])

cur.execute("SELECT ROWID, email, role, display_name FROM ci_Users WHERE email=?", (admin_email,))
row = cur.fetchone()
print("existing:", row)
if row:
    cur.execute("UPDATE ci_Users SET password_hash=?, role=?, status='active', display_name='Admin User' WHERE email=?", (admin_hash, "admin", admin_email))
    print("updated admin")
else:
    now = datetime.datetime.utcnow().isoformat()
    cur.execute("INSERT INTO ci_Users (display_name, email, password_hash, role, badge_number, phone, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                ("Admin User", admin_email, admin_hash, "admin", "ADMIN001", "", "active", now, now))
    print("inserted admin", cur.lastrowid)
con.commit()

cur.execute("SELECT ROWID, email, role, display_name FROM ci_Users WHERE email=?", (admin_email,))
print(cur.fetchone())

# also ensure officers can login? keep existing users
cur.execute("SELECT count(*) FROM ci_Users")
print("total ci_Users:", cur.fetchone())

con.close()
print("done")
