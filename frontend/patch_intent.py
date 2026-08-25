with open('services/intent_service.py', 'r') as f:
    content = f.read()

# Add fix: if no known locations matched, clear locations
# This will prevent routing to location_query for invalid locations like "Mars"
old = '''        if known_matches:
            normalized = [self._normalize_location(loc) for loc in known_matches]
            entities['locations'] = normalized
        else:
            location_matches = self.LOCATION_EXTRACTION.findall(text)'''

new = '''        if known_matches:
            normalized = [self._normalize_location(loc) for loc in known_matches]
            entities['locations'] = normalized
        else:
            # No known locations matched - don't set locations to avoid
            # routing to location_query for invalid locations like "Mars"
            entities['locations'] = None
            location_matches = self.LOCATION_EXTRACTION.findall(text)'''

if old in content:
    content = content.replace(old, new)
    print('Fix applied')
else:
    print('Old string not found')
    # Debug: find the location
    idx = content.find('if known_matches:')
    if idx >= 0:
        print('Found at index', idx)
        print(content[idx:idx+300])
else:
    print('Old string NOT found')
PYEOF