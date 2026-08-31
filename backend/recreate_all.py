from app.database import SessionLocal, engine, Base
from app.models import User, Case, CaseEvent, Evidence, VerificationDocument
from app.models import UserRole, AccountStatus, VerificationStatus, DocumentType
from app.security import hash_password
from datetime import datetime, timedelta
import random

# Recreate all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Create admin user
admin = User(
    username="admin",
    email="admin@ksp.gov.in",
    full_name="Admin User",
    password_hash=hash_password("AdminPass123"),
    employee_id="ADMIN001",
    department="Karnataka State Police",
    designation="DGP",
    role=UserRole.ADMIN,
    account_status=AccountStatus.APPROVED,
    is_active=True,
)
db.add(admin)
db.commit()
db.refresh(admin)
print("Admin created:", admin.email)

# Karnataka districts with specific localities/neighborhoods
district_localities = {
    "Bengaluru Urban": [
        "Jalahalli", "Nagasandra", "Yeshwanthpur", "Rajajinagar", "Malleswaram",
        "Koramangala", "Indiranagar", "Jayanagar", "BTM Layout", "HSR Layout",
        "Whitefield", "Marathahalli", "Electronic City", "Sarjapur", "Bellandur",
        "Hebbal", "Yelahanka", "Peenya", "Mahadevapura", "Kengeri"
    ],
    "Bengaluru Rural": [
        "Devanahalli", "Doddaballapur", "Hosakote", "Nelamangala",
        "Vijayapura", "Magadi", "Kanakapura", "Ramanagara"
    ],
    "Mysuru": [
        "Mysore City", "Nanjangud", "Hunsur", "Periyapatna",
        "Krishnarajanagara", "Tirumakudalu", "Narasipura", "Heggadadevankote"
    ],
    "Mangaluru": [
        "Mangalore City", "Surathkal", "Ullal", "Bantwal",
        "Puttur", "Sullia", "Belthangady", "Moodbidri"
    ],
    "Hubballi-Dharwad": [
        "Hubballi", "Dharwad", "Navalgund", "Kundgol",
        "Kalghatgi", "Alnavar", "Shiggavi", "Shirahatti"
    ],
    "Belagavi": [
        "Belgaum", "Athani", "Bailhongal", "Chikkodi",
        "Gokak", "Hukkeri", "Khanapur", "Raibag", "Saundatti"
    ],
    "Kalaburagi": [
        "Gulbarga", "Aland", "Afzalpur", "Chincholi",
        "Chittapur", "Jevargi", "Sedam", "Yadrami"
    ],
    "Davanagere": [
        "Davanagere", "Harihar", "Honnali", "Channagiri",
        "Jagalur", "Harapanahalli", "Channagiri", "Nyamati"
    ],
    "Ballari": [
        "Bellary", "Hospet", "Sandur", "Siruguppa",
        "Tekkalakote", "Kudligi", "Hagari", "Kampli"
    ],
    "Shivamogga": [
        "Shimoga", "Bhadravathi", "Sagar", "Shikaripur",
        "Sorab", "Thirthahalli", "Hosanagara", "Kargal"
    ],
    "Tumakuru": [
        "Tumkur", "Sira", "Tiptur", "Kunigal",
        "Turuvekere", "Gubbi", "Koratagere", "Madhugiri"
    ],
    "Vijayapura": [
        "Bijapur", "Indi", "Sindagi", "Basavana Bagewadi",
        "Muddebihal", "Tikota", "Nalatwad", "Devar Hippargi"
    ],
    "Raichur": [
        "Raichur", "Sindhanur", "Manvi", "Devadurga",
        "Lingasugur", "Maski", "Sirwar", "Kavital"
    ],
    "Belagavi": [
        "Belgaum", "Athani", "Bailhongal", "Chikkodi",
        "Gokak", "Hukkeri", "Khanapur", "Raibag", "Saundatti"
    ],
    "Kalaburagi": [
        "Gulbarga", "Aland", "Afzalpur", "Chincholi",
        "Chittapur", "Jevargi", "Sedam", "Yadrami"
    ],
    "Davanagere": [
        "Davanagere", "Harihar", "Honnali", "Channagiri",
        "Jagalur", "Harapanahalli", "Channagiri", "Nyamati"
    ],
    "Ballari": [
        "Bellary", "Hospet", "Sandur", "Siruguppa",
        "Tekkalakote", "Kudligi", "Hagari", "Kampli"
    ],
    "Shivamogga": [
        "Shimoga", "Bhadravathi", "Sagar", "Shikaripur",
        "Sorab", "Thirthahalli", "Hosanagara", "Kargal"
    ],
    "Tumakuru": [
        "Tumkur", "Sira", "Tiptur", "Kunigal",
        "Turuvekere", "Gubbi", "Koratagere", "Madhugiri"
    ],
    "Vijayapura": [
        "Bijapur", "Indi", "Sindagi", "Basavana Bagewadi",
        "Muddebihal", "Tikota", "Nalatwad", "Devar Hippargi"
    ],
    "Raichur": [
        "Raichur", "Sindhanur", "Manvi", "Devadurga",
        "Lingasugur", "Maski", "Sirwar", "Kavital"
    ],
    "Belagavi": [
        "Belgaum", "Athani", "Bailhongal", "Chikkodi",
        "Gokak", "Hukkeri", "Khanapur", "Raibag", "Saundatti"
    ],
    "Kalaburagi": [
        "Gulbarga", "Aland", "Afzalpur", "Chincholi",
        "Chittapur", "Jevargi", "Sedam", "Yadrami"
    ],
    "Davanagere": [
        "Davanagere", "Harihar", "Honnali", "Channagiri",
        "Jagalur", "Harapanahalli", "Channagiri", "Nyamati"
    ],
    "Ballari": [
        "Bellary", "Hospet", "Sandur", "Siruguppa",
        "Tekkalakote", "Kudligi", "Hagari", "Kampli"
    ],
    "Shivamogga": [
        "Shimoga", "Bhadravathi", "Sagar", "Shikaripur",
        "Sorab", "Thirthahalli", "Hosanagara", "Kargal"
    ],
    "Tumakuru": [
        "Tumkur", "Sira", "Tiptur", "Kunigal",
        "Turuvekere", "Gubbi", "Koratagere", "Madhugiri"
    ],
    "Vijayapura": [
        "Bijapur", "Indi", "Sindagi", "Basavana Bagewadi",
        "Muddebihal", "Tikota", "Nalatwad", "Devar Hippargi"
    ],
    "Raichur": [
        "Raichur", "Sindhanur", "Manvi", "Devadurga",
        "Lingasugur", "Maski", "Sirwar", "Kavital"
    ],
    "Belagavi": [
        "Belgaum", "Athani", "Bailhongal", "Chikkodi",
        "Gokak", "Hukkeri", "Khanapur", "Raibag", "Saundatti"
    ],
    "Kalaburagi": [
        "Gulbarga", "Aland", "Afzalpur", "Chincholi",
        "Chittapur", "Jevargi", "Sedam", "Yadrami"
    ],
    "Davanagere": [
        "Davanagere", "Harihar", "Honnali", "Channagiri",
        "Jagalur", "Harapanahalli", "Channagiri", "Nyamati"
    ],
    "Ballari": [
        "Bellary", "Hospet", "Sandur", "Siruguppa",
        "Tekkalakote", "Kudligi", "Hagari", "Kampli"
    ],
    "Shivamogga": [
        "Shimoga", "Bhadravathi", "Sagar", "Shikaripur",
        "Sorab", "Thirthahalli", "Hosanagara", "Kargal"
    ],
    "Tumakuru": [
        "Tumkur", "Sira", "Tiptur", "Kunigal",
        "Turuvekere", "Gubbi", "Koratagere", "Madhugiri"
    ],
    "Vijayapura": [
        "Bijapur", "Indi", "Sindagi", "Basavana Bagewadi",
        "Muddebihal", "Tikota", "Nalatwad", "Devar Hippargi"
    ],
    "Raichur": [
        "Raichur", "Sindhanur", "Manvi", "Devadurga",
        "Lingasugur", "Maski", "Sirwar", "Kavital"
    ],
    "Belagavi": [
        "Belgaum", "Athani", "Bailhongal", "Chikkodi",
        "Gokak", "Hukkeri", "Khanapur", "Raibag", "Saundatti"
    ],
    "Kalaburagi": [
        "Gulbarga", "Aland", "Afzalpur", "Chincholi",
        "Chittapur", "Jevargi", "Sedam", "Yadrami"
    ],
    "Davanagere": [
        "Davanagere", "Harihar", "Honnali", "Channagiri",
        "Jagalur", "Harapanahalli", "Channagiri", "Nyamati"
    ],
    "Ballari": [
        "Bellary", "Hospet", "Sandur", "Siruguppa",
        "Tekkalakote", "Kudligi", "Hagari", "Kampli"
    ],
    "Shivamogga": [
        "Shimoga", "Bhadravathi", "Sagar", "Shikaripur",
        "Sorab", "Thirthahalli", "Hosanagara", "Kargal"
    ],
    "Tumakuru": [
        "Tumkur", "Sira", "Tiptur", "Kunigal",
        "Turuvekere", "Gubbi", "Koratagere", "Madhugiri"
    ],
    "Vijayapura": [
        "Bijapur", "Indi", "Sindagi", "Basavana Bagewadi",
        "Muddebihal", "Tikota", "Nalatwad", "Devar Hippargi"
    ],
    "Raichur": [
        "Raichur", "Sindhanur", "Manvi", "Devadurga",
        "Lingasugur", "Maski", "Sirwar", "Kavital"
    ],
    "Belagavi": [
        "Belgaum", "Athani", "Bailhongal", "Chikkodi",
        "Gokak", "Hukkeri", "Khanapur", "Raibag", "Saundatti"
    ],
    "Kalaburagi": [
        "Gulbarga", "Aland", "Afzalpur", "Chincholi",
        "Chittapur", "Jevargi", "Sedam", "Yadrami"
    ],
    "Davanagere": [
        "Davanagere", "Harihar", "Honnali", "Channagiri",
        "Jagalur", "Harapanahalli", "Channagiri", "Nyamati"
    ],
    "Ballari": [
        "Bellary", "Hospet", "Sandur", "Siruguppa",
        "Tekkalakote", "Kudligi", "Hagari", "Kampli"
    ],
    "Shivamogga": [
        "Shimoga", "Bhadravathi", "Sagar", "Shikaripur",
        "Sorab", "Thirthahalli", "Hosanagara", "Kargal"
    ],
    "Tumakuru": [
        "Tumkur", "Sira", "Tiptur", "Kunigal",
        "Turuvekere", "Gubbi", "Koratagere", "Madhugiri"
    ],
    "Vijayapura": [
        "Bijapur", "Indi", "Sindagi", "Basavana Bagewadi",
        "Muddebihal", "Tikota", "Nalatwad", "Devar Hippargi"
    ],
    "Raichur": [
        "Raichur", "Sindhanur", "Manvi", "Devadurga",
        "Lingasugur", "Maski", "Sirwar", "Kavital"
    ],
}

# Get list of districts and crime types
districts = list(district_localities.keys())
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

db = SessionLocal()

# Create admin user
admin = User(
    username="admin",
    email="admin@ksp.gov.in",
    full_name="Admin User",
    password_hash=hash_password("AdminPass123"),
    employee_id="ADMIN001",
    department="Karnataka State Police",
    designation="DGP",
    role=UserRole.ADMIN,
    account_status=AccountStatus.APPROVED,
    is_active=True,
)
db.add(admin)
db.commit()
db.refresh(admin)
print("Admin created:", admin.email)

# Generate ~800 cases
total_cases = 800
created_cases = []

for i in range(total_cases):
    crime = random.choice(crime_types)
    district = random.choice(districts)
    locality = random.choice(district_localities[district])
    
    # Generate varied dates across the past year
    base_date = datetime.utcnow() - timedelta(days=random.randint(1, 365))
    reported_at = base_date
    occurred_at = base_date - timedelta(days=random.randint(0, 7))  # Occurred before reported
    created_at = base_date + timedelta(hours=random.randint(0, 24))  # Created after reported
    
    case = Case(
        case_number=f"CRIME-2024-{1000+i:05d}",
        title=f"{crime} at {locality}",
        description=f"Reported {crime.lower()} incident at {locality}, {district}. Under investigation.",
        category=crime,
        district=district,
        locality=locality,
        status=random.choice(statuses),
        priority=random.choice(priorities),
        reported_at=base_date,
        occurred_at=occurred_at,
        created_at=base_date,
        created_by_id=admin.id,
        latitude=str(12.9716 + (random.random() - 0.5) * 2),
        longitude=str(77.5946 + (random.random() - 0.5) * 2),
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