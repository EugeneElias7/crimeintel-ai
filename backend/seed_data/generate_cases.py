"""Synthetic data generator for CrimeIntel AI MVP."""

import json
import random
import uuid
from datetime import datetime, timedelta

CRIME_TYPES = [
    "theft", "assault", "murder", "robbery", "cybercrime",
    "fraud", "kidnapping", "rioting", "dacoity", "other"
]

STATUSES = ["open", "under_investigation", "closed", "filed"]

PRIORITIES = ["low", "medium", "high", "critical"]

DISTRICTS = [
    "Bangalore Urban", "Bangalore Rural", "Mysore", "Hubli",
    "Mangalore", "Belgaum", "Gulbarga", "Dharwad",
    "Shimoga", "Tumkur"
]

LOCATIONS = [
    "Majestic, Bangalore", "MG Road, Bangalore", "Koramangala, Bangalore",
    "Indiranagar, Bangalore", "Whitefield, Bangalore", "Jayanagar, Bangalore",
    "Jalahalli, Bangalore", "Vijayanagar, Bangalore", "Malleshwaram, Bangalore",
    "BTM Layout, Bangalore", "Hebbal, Bangalore", "Yelahanka, Bangalore",
    "Seshadripuram, Bangalore", "Basavanagudi, Bangalore", "Sadashivanagar, Bangalore",
    "Kuvempunagar, Mysore", "Vijayanagar, Mysore", "Gokulam, Mysore",
    "Gokul Road, Hubli", "Vidyanagar, Hubli", "Keshwapur, Hubli",
    "Bejai, Mangalore", "Kankanady, Mangalore", "Kadri, Mangalore",
    "Shahapur, Belgaum", "Tilakwadi, Belgaum", "Bogarves, Belgaum",
    "Shastrinagar, Gulbarga", "Bhim Nagar, Gulbarga", "Saptapur, Dharwad",
    "Vinobanagar, Shimoga", "Gandhinagar, Tumkur"
]

FIRST_NAMES = [
    "Arun", "Ravi", "Suresh", "Manoj", "Vikas", "Praveen", "Vinay",
    "Kiran", "Dinesh", "Ramesh", "Mahesh", "Ganesh", "Sachin",
    "Anil", "Sunil", "Sanjay", "Vijay", "Ajay", "Rajesh", "Deepak",
    "Priya", "Anita", "Sunita", "Kavita", "Rekha", "Geeta", "Neha",
    "Pooja", "Shweta", "Divya", "Nandini", "Laxmi", "Saraswati"
]

LAST_NAMES = [
    "Kumar", "Sharma", "Patel", "Singh", "Verma", "Reddy", "Naik",
    "Joshi", "Desai", "Rao", "Hegde", "Shetty", "Acharya", "Kamath",
    "Prasad", "Nair", "Menon", "Iyer", "Murthy", "Pillai"
]

CRIME_DESCRIPTIONS = {
    "theft": [
        "Complainant reported theft of {item} from {location} on {date}. The accused allegedly took the item while the victim was {activity}.",
        "A case of theft has been registered at {station} station. The complainant stated that unknown persons stole {item} worth Rs.{amount}.",
        "Theft reported at {location}. CCTV footage shows an unidentified person taking the item and fleeing the scene."
    ],
    "assault": [
        "Physical assault reported at {location}. The victim sustained {injury} and was treated at {hospital}.",
        "A group of individuals allegedly assaulted the complainant near {location}. Case registered under IPC sections.",
        "Altercation at {location} led to physical assault. Both parties have been identified and statements recorded."
    ],
    "murder": [
        "A dead body was discovered at {location} with visible injuries. Investigation underway to identify the accused.",
        "Homicide reported at {location}. The deceased has been identified as {victim_name}. Multiple suspects being questioned.",
        "Murder case registered following the death of {victim_name} at {location}. Forensic team visited the scene."
    ],
    "robbery": [
        "Robbery reported at {location}. Armed individuals allegedly stole {item} and fled the scene on a motorcycle.",
        "A robbery was committed at {location}. The accused threatened the victim with a weapon and made off with valuables.",
        "Chain snatching incident at {location}. Two unknown persons on a motorcycle snatched a gold chain and escaped."
    ],
    "cybercrime": [
        "Online fraud reported. The victim lost Rs.{amount} to a phishing scam involving {details}.",
        "Cybercrime complaint filed regarding unauthorized access to bank account. Amount debited: Rs.{amount}.",
        "Social media account hacking reported. The accused allegedly impersonated the victim and demanded money from contacts."
    ],
    "fraud": [
        "Cheating case registered against {suspect_name} for allegedly defrauding the complainant of Rs.{amount}.",
        "Land fraud case. The accused allegedly sold a property using forged documents to multiple buyers.",
        "Financial fraud reported. Unauthorized transactions totalling Rs.{amount} were made from the complainant's account."
    ],
    "kidnapping": [
        "Kidnapping reported. The victim, {victim_name}, was last seen at {location} on {date}. Search operation underway.",
        "A minor has been reported missing from {location}. Suspected kidnapping. All nearby stations have been alerted.",
        "Kidnapping for ransom. The accused have demanded Rs.{amount} for the safe release of {victim_name}."
    ],
    "rioting": [
        "Group clash reported at {location}. Multiple individuals involved in a violent altercation. Property damage reported.",
        "Public unrest at {location}. A large crowd gathered and engaged in violent activities. Police deployed to control situation.",
        "Communal tension escalated into rioting at {location}. Curfew imposed in the affected area."
    ],
    "dacoity": [
        "Dacoity reported at {location}. A group of armed individuals entered the premises and looted valuables worth Rs.{amount}.",
        "Highway robbery by a group of dacoits near {location}. Travellers were stopped and robbed at knife-point.",
        "House break-in by a gang. Multiple accused entered the residence and decamped with cash and jewellery."
    ],
    "other": [
        "Miscellaneous complaint registered at {station} station. Further investigation in progress.",
        "Case registered under relevant sections based on complaint by {victim_name} against unknown persons.",
        "Complaint regarding {details} has been registered and investigation has been initiated."
    ]
}

ITEMS = [
    "mobile phone", "laptop", "wallet", "purse", "bicycle",
    "motorcycle", "jewellery", "cash", "documents", "bag"
]

INJURIES = ["minor injuries", "fractured arm", "head injury", "bruises and scratches"]
HOSPITALS = ["Victoria Hospital", "Bowring Hospital", "KC General Hospital", "St. Martha's Hospital"]

STATIONS = ["Majestic", "MG Road", "Koramangala", "Indiranagar", "Whitefield", "Jayanagar"]


def generate_random_date(start_year=2024, end_year=2026):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 7, 26)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)


def generate_case_id(index: int) -> str:
    year = 2024 + random.randint(0, 2)
    return f"FIR-{year}-{index:06d}"


def generate_fir_number(index: int) -> str:
    station_code = random.choice(["BLR", "MYS", "HBL", "MLR", "BLG", "GLB"])
    year = 2024 + random.randint(0, 2)
    return f"KSP-{station_code}-{year}-{index:04d}"


def generate_person_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def generate_description(crime_type: str, location: str) -> str:
    templates = CRIME_DESCRIPTIONS.get(crime_type, CRIME_DESCRIPTIONS["other"])
    template = random.choice(templates)
    return template.format(
        location=location,
        station=random.choice(STATIONS),
        item=random.choice(ITEMS),
        amount=random.randint(5000, 500000),
        injury=random.choice(INJURIES),
        hospital=random.choice(HOSPITALS),
        victim_name=generate_person_name(),
        suspect_name=generate_person_name(),
        details=random.choice(["fraudulent emails", "fake customer support", "SIM swap", "phishing links"]),
        date=datetime.now().strftime("%d-%m-%Y"),
        activity=random.choice(["waiting for a bus", "shopping", "walking", "at a restaurant"])
    )


def generate_suspects(case_id: str) -> list:
    count = random.randint(0, 3)
    suspects = []
    for i in range(count):
        name = generate_person_name()
        suspects.append({
            "suspect_id": f"sus_{uuid.uuid4().hex[:8]}",
            "case_id": case_id,
            "name": name,
            "alias": random.choice([None, name.split()[0], "Unknown"]) if random.random() > 0.5 else None,
            "age": random.randint(18, 55),
            "gender": random.choice(["male", "female"]),
            "address": f"{random.randint(1, 999)}, {random.choice(LOCATIONS)}",
            "identification_marks": random.choice([None, "scar on left cheek", "tattoo on right arm", None, None]),
            "status": random.choice(["wanted", "arrested", "released"])
        })
    return suspects


def generate_witnesses(case_id: str) -> list:
    count = random.randint(0, 2)
    witnesses = []
    for i in range(count):
        witnesses.append({
            "witness_id": f"wit_{uuid.uuid4().hex[:8]}",
            "case_id": case_id,
            "name": generate_person_name(),
            "contact": f"98{random.randint(10000000, 99999999)}",
            "statement_summary": "Saw the incident and identified the accused.",
            "credibility_score": round(random.uniform(0.5, 1.0), 2),
            "status": random.choice(["recorded", "verified"])
        })
    return witnesses


def generate_timeline(case_id: str, date_filed: str, officer_id: str) -> list:
    filed_date = datetime.fromisoformat(date_filed)
    events = [
        {
            "event_id": f"evt_{uuid.uuid4().hex[:8]}",
            "case_id": case_id,
            "event_date": filed_date.isoformat(),
            "event_type": "fir_registered",
            "description": "FIR registered at the police station.",
            "officer_id": officer_id
        }
    ]
    if random.random() > 0.3:
        events.append({
            "event_id": f"evt_{uuid.uuid4().hex[:8]}",
            "case_id": case_id,
            "event_date": (filed_date + timedelta(days=random.randint(1, 7))).isoformat(),
            "event_type": "suspect_identified",
            "description": "Suspect identified through investigation.",
            "officer_id": officer_id
        })
    if random.random() > 0.5:
        events.append({
            "event_id": f"evt_{uuid.uuid4().hex[:8]}",
            "case_id": case_id,
            "event_date": (filed_date + timedelta(days=random.randint(3, 30))).isoformat(),
            "event_type": "evidence_collected",
            "description": "Physical evidence collected from the crime scene.",
            "officer_id": officer_id
        })
    return events


def generate_cases(count: int = 500) -> dict:
    officers = [
        {"user_id": "usr_001", "display_name": "SI Arun Kumar", "badge_number": "KSP-2024-0789"},
        {"user_id": "usr_002", "display_name": "Insp. Priya Sharma", "badge_number": "KSP-2024-0456"},
        {"user_id": "usr_003", "display_name": "SI Manoj Reddy", "badge_number": "KSP-2024-0123"},
        {"user_id": "usr_004", "display_name": "SI Geeta Verma", "badge_number": "KSP-2024-0678"},
        {"user_id": "usr_005", "display_name": "Insp. Suresh Naik", "badge_number": "KSP-2024-0345"},
    ]

    cases = []
    suspects = []
    witnesses = []
    timeline = []

    for i in range(1, count + 1):
        date_filed = generate_random_date()
        case_id = generate_case_id(i)
        district = random.choice(DISTRICTS)
        location = random.choice([loc for loc in LOCATIONS if district.split()[0] in loc or random.random() > 0.7]) or random.choice(LOCATIONS)
        crime_type = random.choice(CRIME_TYPES)
        status = random.choice(STATUSES)
        officer = random.choice(officers)

        lat_lng = {
            "Bangalore Urban": (12.97, 77.59),
            "Bangalore Rural": (13.05, 77.60),
            "Mysore": (12.30, 76.64),
            "Hubli": (15.35, 75.14),
            "Mangalore": (12.91, 74.86),
            "Belgaum": (15.86, 74.51),
            "Gulbarga": (17.33, 76.84),
            "Dharwad": (15.46, 75.01),
            "Shimoga": (13.93, 75.56),
            "Tumkur": (13.34, 77.10)
        }
        lat = lat_lng.get(district, (12.97, 77.59))[0] + random.uniform(-0.05, 0.05)
        lng = lat_lng.get(district, (12.97, 77.59))[1] + random.uniform(-0.05, 0.05)

        now = datetime.now().isoformat()
        case = {
            "case_id": case_id,
            "fir_number": generate_fir_number(i),
            "crime_type": crime_type,
            "status": status,
            "date_filed": date_filed.strftime("%Y-%m-%d"),
            "date_closed": date_filed.strftime("%Y-%m-%d") if status == "closed" else None,
            "location": location,
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "district": district,
            "description": generate_description(crime_type, location),
            "officer_id": officer["user_id"],
            "priority": random.choice(PRIORITIES),
            "created_at": now,
            "updated_at": now
        }
        cases.append(case)
        suspects.extend(generate_suspects(case_id))
        witnesses.extend(generate_witnesses(case_id))
        timeline.extend(generate_timeline(case_id, date_filed.isoformat(), officer["user_id"]))

    return {
        "officers": officers,
        "cases": cases,
        "suspects": suspects,
        "witnesses": witnesses,
        "timeline": timeline
    }


if __name__ == "__main__":
    data = generate_cases(500)
    with open("seed_data.json", "w") as f:
        json.dump(data, f, indent=2)
    print(f"Generated {len(data['cases'])} cases")
    print(f"Generated {len(data['suspects'])} suspects")
    print(f"Generated {len(data['witnesses'])} witnesses")
    print(f"Generated {len(data['timeline'])} timeline events")
