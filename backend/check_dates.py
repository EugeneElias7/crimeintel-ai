from app.database import SessionLocal
from app.models import Case

db = SessionLocal()
cases = db.query(Case).limit(10).all()
for c in cases:
    print(f'{c.case_number}: reported={c.reported_at}, created={c.created_at}')
db.close()