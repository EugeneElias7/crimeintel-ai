from app.database import SessionLocal
from app.models import Case
from app.geo_utils import DISTRICT_CENTERS
import random

db = SessionLocal()

# Coastal districts that need inland bias
COASTAL_DISTRICTS = {
    'Mangaluru': (12.9141, 74.856),
    'Udupi': (13.3409, 74.7421),
    'Uttara Kannada': (14.5344, 74.4395),
    'Dakshina Kannada': (12.8438, 75.2479),
}

# Inland districts with normal random spread
INLAND_DISTRICTS = {
    'Bengaluru Urban': (12.9716, 77.5946),
    'Bengaluru Rural': (13.1987, 77.7066),
    'Mysuru': (12.2958, 76.6394),
    'Hubballi-Dharwad': (15.3647, 75.1240),
    'Belagavi': (15.8497, 74.4977),
    'Kalaburagi': (17.3297, 76.8343),
    'Davanagere': (14.4644, 75.9218),
    'Ballari': (15.1394, 76.9214),
    'Shivamogga': (13.9299, 75.5681),
    'Tumakuru': (13.3409, 77.1010),
    'Vijayapura': (16.8302, 75.7100),
    'Raichur': (16.2076, 77.3440),
    'Bidar': (17.9104, 77.5199),
    'Yadgir': (16.7586, 77.1324),
    'Koppal': (15.3512, 76.1586),
    'Gadag': (15.4278, 75.6313),
    'Haveri': (14.7951, 75.4010),
    'Dakshina Kannada': (12.8438, 75.2479),
    'Udupi': (13.3409, 74.7421),
    'Chikkamagaluru': (13.3161, 75.7720),
    'Hassan': (13.0068, 76.1003),
    'Mandya': (12.5243, 76.8957),
    'Chamarajanagar': (11.9265, 76.9412),
    'Kodagu': (12.3375, 75.8069),
    'Chitradurga': (14.2251, 76.3980),
    'Kolar': (13.1339, 78.1297),
    'Ramanagara': (12.7216, 77.2818),
    'Hubballi-Dharwad': (15.3647, 75.1240),
    'Yadgir': (16.7586, 77.1324),
    'Bengaluru Rural': (13.1987, 77.7066),
    'Mysuru': (12.2958, 76.6394),
    'Belagavi': (15.8497, 74.4977),
    'Kalaburagi': (17.3297, 76.8343),
    'Davanagere': (14.4644, 75.9218),
    'Ballari': (15.1394, 76.9214),
    'Shivamogga': (13.9299, 75.5681),
    'Tumakuru': (13.3409, 77.1010),
    'Vijayapura': (16.8302, 75.7100),
    'Raichur': (16.2076, 77.3440),
    'Bidar': (17.9104, 77.5199),
    'Yadgir': (16.7586, 77.1324),
    'Koppal': (15.3512, 76.1586),
    'Gadag': (15.4278, 75.6313),
    'Haveri': (14.7951, 75.4010),
    'Uttara Kannada': (14.5344, 74.4395),
    'Dakshina Kannada': (12.8438, 75.2479),
    'Udupi': (13.3409, 74.7421),
    'Chikkamagaluru': (13.3161, 75.7720),
    'Hassan': (13.0068, 76.1003),
    'Mandya': (12.5243, 76.8957),
    'Chamarajanagar': (11.9265, 76.9412),
    'Kodagu': (12.3375, 75.8069),
    'Chitradurga': (14.2251, 76.3980),
    'Kolar': (13.1339, 78.1297),
    'Ramanagara': (12.7216, 77.2818),
    'Hubballi-Dharwad': (15.3647, 75.1240),
    'Yadgir': (16.7586, 77.1324),
}

def get_coords_for_district(district: str) -> tuple:
    """Get coordinates biased inland for coastal districts."""
    if district in COASTAL_DISTRICTS:
        base_lat, base_lng = COASTAL_DISTRICTS[district]
        # Bias inland (east) - reduce longitude spread, bias east
        lat = base_lat + (random.random() - 0.5) * 0.1  # ±0.05°
        lng = base_lng + random.random() * 0.08  # 0 to +0.08° (eastward/inland)
        return lat, lng
    else:
        base_lat, base_lng = INLAND_DISTRICTS.get(district, (12.9716, 77.5946))
        lat = base_lat + (random.random() - 0.5) * 0.15
        lng = base_lng + (random.random() - 0.5) * 0.15
        return lat, lng

db = SessionLocal()
cases = db.query(Case).all()
fixed = 0

for case in cases:
    lat, lng = get_coords_for_district(case.district)
    case.latitude = str(lat)
    case.longitude = str(lng)
    fixed += 1
    
    if fixed % 100 == 0:
        db.commit()
        print(f"Fixed {fixed} cases...")

db.commit()
print(f"Fixed {fixed} cases total")

# Verify coastal districts
from app.database import SessionLocal as SL
from app.models import Case as C
from app.geo_utils import validate_case_coordinates

db2 = SL()
mangaluru = db2.query(C).filter(C.district == 'Mangaluru').limit(3).all()
print('Mangaluru:')
for c in mangaluru:
    print(f'  {c.case_number}: lat={c.latitude}, lng={c.longitude}')

udupi = db2.query(C).filter(C.district == 'Udupi').limit(3).all()
print('Udupi:')
for c in udupi:
    print(f'  {c.case_number}: lat={c.latitude}, lng={c.longitude}')

db2.close()
db.close()