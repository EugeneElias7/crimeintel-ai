from typing import Tuple, Optional

KARNATAKA_BOUNDS = {
    "lat_min": 11.0,
    "lat_max": 19.0,
    "lng_min": 73.5,
    "lng_max": 78.5,
}

DISTRICT_CENTERS = {
    "Bengaluru Urban": (12.9716, 77.5946),
    "Bengaluru Rural": (13.1987, 77.7066),
    "Mysuru": (12.2958, 76.6394),
    "Mangaluru": (12.9141, 74.8560),
    "Hubballi-Dharwad": (15.3647, 75.1240),
    "Belagavi": (15.8497, 74.4977),
    "Kalaburagi": (17.3297, 76.8343),
    "Davanagere": (14.4644, 75.9218),
    "Ballari": (15.1394, 76.9214),
    "Shivamogga": (13.9299, 75.5681),
    "Tumakuru": (13.3409, 77.1010),
    "Vijayapura": (16.8302, 75.7100),
    "Raichur": (16.2076, 77.3440),
    "Bidar": (17.9104, 77.5199),
    "Yadgir": (16.7586, 77.1324),
    "Koppal": (15.3512, 76.1586),
    "Gadag": (15.4278, 75.6313),
    "Haveri": (14.7951, 75.4010),
    "Uttara Kannada": (14.5344, 74.4395),
    "Dakshina Kannada": (12.8438, 75.2479),
    "Udupi": (13.3409, 74.7421),
    "Chikkamagaluru": (13.3161, 75.7720),
    "Hassan": (13.0068, 76.1003),
    "Mandya": (12.5243, 76.8957),
    "Chamarajanagar": (11.9265, 76.9412),
    "Kodagu": (12.3375, 75.8069),
    "Chitradurga": (14.2251, 76.3980),
    "Kolar": (13.1339, 78.1297),
    "Ramanagara": (12.7216, 77.2818),
    "Hubballi-Dharwad": (15.3647, 75.1240),
    "Yadgir": (16.7586, 77.1324),
}

def validate_coordinates(latitude: float, longitude: float) -> Tuple[bool, Optional[str]]:
    """Validate coordinates are within Karnataka bounds."""
    if latitude < KARNATAKA_BOUNDS["lat_min"] or latitude > KARNATAKA_BOUNDS["lat_max"]:
        return False, f"Latitude {latitude} outside Karnataka bounds ({KARNATAKA_BOUNDS['lat_min']}-{KARNATAKA_BOUNDS['lat_max']})"
    if longitude < KARNATAKA_BOUNDS["lng_min"] or longitude > KARNATAKA_BOUNDS["lng_max"]:
        return False, f"Longitude {longitude} outside Karnataka bounds ({KARNATAKA_BOUNDS['lng_min']}-{KARNATAKA_BOUNDS['lng_max']})"
    return True, None

def validate_case_coordinates(latitude: Optional[str], longitude: Optional[str]) -> Tuple[bool, Optional[str], Optional[float], Optional[float]]:
    """Validate and parse case coordinates. Returns (is_valid, error_message, lat, lng)."""
    if latitude is None or longitude is None:
        return False, "Missing latitude or longitude", None, None
    
    try:
        lat = float(latitude)
        lng = float(longitude)
    except (ValueError, TypeError):
        return False, f"Invalid coordinate format: lat={latitude}, lng={longitude}", None, None
    
    is_valid, error = validate_coordinates(lat, lng)
    if not is_valid:
        return False, error, None, None
    
    return True, None, lat, lng

def get_district_center(district: str) -> Tuple[float, float]:
    """Get approximate center coordinates for a district."""
    return DISTRICT_CENTERS.get(district, (12.9716, 77.5946))