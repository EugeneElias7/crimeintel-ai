from app.database import SessionLocal
from app.models import Case, User

db = SessionLocal()

# Total cases
total = db.query(Case).count()
print(f"Total cases: {total}")

# Cases with coordinates
with_coords = db.query(Case).filter(Case.latitude.isnot(None), Case.longitude.isnot(None)).count()
print(f"Cases with coordinates: {with_coords}")

# Cases without coordinates
without_coords = db.query(Case).filter(Case.latitude.is_(None) | Case.longitude.is_(None)).count()
print(f"Cases without coordinates: {without_coords}")

# Check coordinate validity
cases_with_coords = db.query(Case).filter(Case.latitude.isnot(None), Case.longitude.isnot(None)).all()

invalid_count = 0
valid_count = 0
for c in cases_with_coords:
    try:
        lat = float(c.latitude)
        lng = float(c.longitude)
        # Karnataka bounds roughly: lat 11.5-18.5, lng 74-78.5
        if lat < 11 or lat > 19 or lng < 73 or lng > 79:
            invalid_count += 1
            print(f"  INVALID: {c.case_number} lat={lat}, lng={lng}, district={c.district}")
        else:
            valid_count += 1
    except:
        invalid_count += 1
        print(f"  PARSE ERROR: {c.case_number} lat={c.latitude}, lng={c.longitude}")

print(f"Valid coordinates: {valid_count}")
print(f"Invalid coordinates: {invalid_count}")

# Districts
districts = db.query(Case.district).distinct().all()
print(f"\nDistricts ({len(districts)}):")
for d in districts:
    count = db.query(Case).filter(Case.district == d[0]).count()
    print(f"  {d[0]}: {count}")

# Case types
categories = db.query(Case.category).distinct().all()
print(f"\nCase Types ({len(categories)}):")
for c in categories:
    count = db.query(Case).filter(Case.category == c[0]).count()
    print(f"  {c[0]}: {count}")

# Statuses
statuses = db.query(Case.status).distinct().all()
print(f"\nStatuses:")
for s in statuses:
    count = db.query(Case).filter(Case.status == s[0]).count()
    print(f"  {s[0]}: {count}")

db.close()