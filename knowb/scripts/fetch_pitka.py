import json, urllib.request, urllib.parse

query = '[out:json][timeout:90];(node["amenity"="drinking_water"](49.94,14.22,50.18,14.71););out body;'
url = 'https://overpass-api.de/api/interpreter'

print("Fetching drinking water data from Overpass API...")
post_data = urllib.parse.urlencode({'data': query}).encode('utf-8')
req = urllib.request.Request(url, data=post_data, headers={"User-Agent": "KnowB/1.0"})
with urllib.request.urlopen(req, timeout=60) as resp:
    data = json.loads(resp.read())

elements = data.get('elements', [])
features = []
for el in elements:
    if 'lat' in el and 'lon' in el:
        props = {k: v for k, v in el.get('tags', {}).items()}
        props['@id'] = 'node/' + str(el['id'])
        features.append({
            'type': 'Feature',
            'properties': props,
            'geometry': {'type': 'Point', 'coordinates': [el['lon'], el['lat']]},
            'id': 'node/' + str(el['id'])
        })

geojson = {
    'type': 'FeatureCollection',
    'generator': 'overpass-turbo',
    'copyright': 'The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.',
    'features': features
}

out = '/Users/teddysk52/Desktop/sus/knowB/knowb/public/prague-data/frontend-data/pitka.geojson'
with open(out, 'w', encoding='utf-8') as f:
    json.dump(geojson, f, ensure_ascii=False, indent=2)

print(f'OK: {len(features)} drinking water features saved to pitka.geojson')
