from app.database import SessionLocal
from app.models import Case, CaseEvent, User, Evidence
from datetime import datetime, timedelta
import random

db = SessionLocal()

# Get admin user
admin = db.query(User).filter(User.email == 'admin@ksp.gov.in').first()
if not admin:
    print("Admin not found!")
    exit()

# Seed cases
crimes = [
    ("Theft", "Bengaluru", "North"),
    ("Burglary", "Bengaluru", "South"),
    ("Assault", "Bengaluru", "East"),
    ("Fraud", "Bengaluru", "West"),
    ("Robbery", "Mysuru", "Central"),
    ("Cyber Crime", "Bengaluru", "Cyber"),
    ("Drug Trafficking", "Mangaluru", "Port"),
    ("Domestic Violence", "Bengaluru", "North"),
    ("Vehicle Theft", "Bengaluru", "South"),
    ("Chain Snatching", "Bengaluru", "Central"),
]

statuses = ["open", "under_investigation", "resolved", "filed"]
priorities = ["low", "medium", "high", "critical"]

created_cases = []
for i, (crime, district, locality) in enumerate(crimes):
    case = Case(
        case_number=f"CRIME-2024-{1000+i:04d}",
        title=f"{crime} at {locality} {district}",
        description=f"Reported {crime.lower()} incident at {locality}, {district}. Under investigation.",
        category=crime,
        district=district,
        locality=locality,
        status=random.choice(statuses),
        priority=random.choice(priorities),
        reported_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
        occurred_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
        created_by_id=admin.id,
    )
    if case.status == "resolved":
        case.resolved_at = case.reported_at + timedelta(days=random.randint(5, 30))
    db.add(case)
    created_cases.append(case)

db.commit()
for c in created_cases:
    db.refresh(c)
    print(f"Created: {c.case_number} - {c.title} ({c.status})")

# Seed case events
event_types = ["created", "updated", "assigned", "evidence_added", "status_changed", "resolved"]
for case in created_cases:
    num_events = random.randint(2, 5)
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
print("Seeding complete!")

# Print summary
total = db.query(Case).count()
print(f"\nTotal cases in DB: {total}")
for status in ["open", "under_investigation", "resolved", "filed"]:
    count = db.query(Case).filter(Case.status == status).count()
    print(f"  {status}: {count}")

db.close()