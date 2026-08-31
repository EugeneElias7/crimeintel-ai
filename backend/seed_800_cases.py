from app.database import SessionLocal
from app.models import Case, CaseEvent, User, Evidence
from datetime import datetime, timedelta
import random

db = SessionLocal()

admin = db.query(User).filter(User.email == 'admin@ksp.gov.in').first()
if not admin:
    print("Admin not found!")
    exit()

# Karnataka districts and crime types
districts = [
    "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mangaluru", "Hubballi-Dharwad",
    "Belagavi", "Kalaburagi", "Davanagere", "Ballari", "Shivamogga",
    "Tumakuru", "Vijayapura", "Raichur", "Bidar", "Yadgir",
    "Koppal", "Gadag", "Haveri", "Uttara Kannada", "Dakshina Kannada",
    "Udupi", "Chikkamagaluru", "Hassan", "Mandya", "Chamarajanagar",
    "Kodagu", "Chitradurga", "Kolar", "Ramanagara", "Yadgir"
]

crime_types = [
    "Theft", "Burglary", "Assault", "Fraud", "Robbery", "Cyber Crime",
    "Drug Trafficking", "Domestic Violence", "Vehicle Theft", "Chain Snatching",
    "Pickpocketing", "Vandalism", "Arson", "Kidnapping", "Extortion",
    "Counterfeiting", "Identity Theft", "Online Fraud", "ATM Fraud", "Credit Card Fraud",
    "Murder", "Attempted Murder", "Rioting", "Unlawful Assembly", "Public Nuisance",
    "Traffic Violation", "Hit and Run", "Drunk Driving", "Rash Driving", "Over Speeding"
]

statuses = ["open", "under_investigation", "resolved", "filed"]
priorities = ["low", "medium", "high", "critical"]

# Generate ~800 cases
total_cases = 800
created_cases = []

for i in range(total_cases):
    crime = random.choice(crime_types)
    district = random.choice(districts)
    locality = f"{random.choice(['North', 'South', 'East', 'West', 'Central'])} {district}"
    
    case = Case(
        case_number=f"CRIME-2024-{1000+i:05d}",
        title=f"{crime} at {locality}",
        description=f"Reported {crime.lower()} incident at {locality}, {district}. Under investigation.",
        category=crime,
        district=district,
        locality=locality,
        status=random.choice(statuses),
        priority=random.choice(priorities),
        reported_at=datetime.utcnow() - timedelta(days=random.randint(1, 365)),
        occurred_at=datetime.utcnow() - timedelta(days=random.randint(1, 365)),
        created_by_id=admin.id,
    )
    if case.status == "resolved":
        case.resolved_at = case.reported_at + timedelta(days=random.randint(5, 60))
    db.add(case)
    created_cases.append(case)
    
    if (i + 1) % 100 == 0:
        db.commit()
        print(f"Created {i + 1} cases...")

db.commit()
for c in created_cases:
    db.refresh(c)

# Seed case events
event_types = ["created", "updated", "assigned", "evidence_added", "status_changed", "resolved"]
for case in created_cases:
    num_events = random.randint(2, 6)
    for j in range(num_events):
        event = CaseEvent(
            case_id=case.id,
            event_type=random.choice(event_types),
            description=f"Case {case.case_number} {random.choice(event_types)}",
            occurred_at=case.reported_at + timedelta(days=j),
            created_at=case.reported_at + timedelta(days=j),
            created_by_id=admin.id,
        )
        db.add(event)

db.commit()
print(f"Seeding complete! Created {total_cases} cases")

# Print summary
total = db.query(Case).count()
print(f"\nTotal cases in DB: {total}")
for status in ["open", "under_investigation", "resolved", "filed"]:
    count = db.query(Case).filter(Case.status == status).count()
    print(f"  {status}: {count}")

db.close()