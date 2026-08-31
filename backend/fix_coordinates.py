from app.database import SessionLocal
from app.models import Case
from app.geo_utils import DISTRICT_CENTERS, validate_case_coordinates
from datetime import datetime
import random

db = SessionLocal()

cases = db.query(Case).all()
print(f"Total cases: {len(cases)}")

fixed = 0
for case in cases:
    center = DISTRICT_CENTERS.get(case.district, (12.9716, 77.5946))
    # Add small random offset within district (~5-10km)
    lat = center[0] + (random.random() - 0.5) * 0.15
    lng = center[1] + (random.random() - 0.5) * 0.15
    
    case.latitude = str(lat)
    case.longitude = str(lng)
    fixed += 1
    
    if fixed % 100 == 0:
        db.commit()
        print(f"Fixed {fixed} cases...")

db.commit()
print(f"Fixed {fixed} cases total")

# Verify
cases = db.query(Case).limit(10).all()
for c in cases:
    is_valid, error, lat, lng = validate_case_coordinates(c.latitude, c.longitude)
    print(f"{c.case_number}: {c.district} -> lat={lat:.4f}, lng={lng:.4f} valid={is_valid}")

db.close()