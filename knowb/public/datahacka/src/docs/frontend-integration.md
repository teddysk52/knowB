# Frontend Integration Guide

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service status |
| POST | `/route` | Compute route |
| GET | `/poi?type=bench\|toilet` | List POIs (optional) |

## POST /route

### Request body

```json
{
  "from": { "lat": 50.087, "lon": 14.421 },
  "to": { "lat": 50.081, "lon": 14.43 },
  "profile": "wheelchair"
}
```

- `from`, `to`: `{ lat: number, lon: number }` (WGS84)
- `profile`: `"default"` | `"wheelchair"` | `"senior"`

### Response shape

```json
{
  "profile": "wheelchair",
  "distanceMeters": 1234,
  "cost": 1500,
  "routeStats": {
    "maxInclinePercent": 4.5,
    "surfaces": ["asphalt", "paving_stones"],
    "edgeCount": 42,
    "stepsCount": 0,
    "stepsMeters": 0,
    "litMeters": 800,
    "unlitMeters": 434,
    "estimatedDurationMinutes": 15.4
  },
  "geometry": {
    "type": "LineString",
    "coordinates": [[14.421, 50.087], [14.422, 50.086], ...]
  },
  "edges": [
    {
      "id": "e_...",
      "fromNodeId": "n_...",
      "toNodeId": "n_...",
      "lengthMeters": 42.3,
      "highway": "footway",
      "surface": "asphalt",
      "incline": "3%"
    }
  ],
  "explanation": [
    "Avoided steps for wheelchair profile",
    "Penalized cobblestone or sett segments"
  ],
  "nearbyPOI": {
    "benches": [{ "id": "...", "type": "bench", "lat": 50.08, "lon": 14.42, ... }],
    "toilets": [{ "id": "...", "type": "toilet", "lat": 50.08, "lon": 14.42, "wheelchair": "yes", ... }],
    "wheelchairToilets": [{ "id": "...", "type": "toilet", "wheelchair": "yes", ... }]
  }
}
```

- `geometry.coordinates`: GeoJSON LineString in `[lon, lat]` order
- `routeStats`: Summary stats – maxInclinePercent, surfaces, stepsCount, litMeters, unlitMeters, estimatedDurationMinutes
- `accessibilityFallback`: If true, no fully accessible wheelchair route existed; response shows best available path with a warning (check `routeStats.surfaces` for sett/cobblestone)
- `edges`: Segments of the route with metadata
- `explanation`: Human-readable reasons for route choices
- `nearbyPOI.wheelchairToilets`: Toilets with `wheelchair=yes` or `wheelchair=limited`; use separately in UI for accessibility

## How to use the response

1. Send selected map click or chosen coordinates as `from` and `to`
2. Send selected profile: `default` | `wheelchair` | `senior`
3. Draw `geometry.coordinates` as a polyline on the map
4. Optionally render `nearbyPOI.benches` and `nearbyPOI.toilets` as markers
5. Show `wheelchairToilets` separately (e.g. distinct icon) for accessibility
6. Show `explanation` as a small list in the UI
7. Display `routeStats` (max incline, surfaces, estimated duration) in a route summary panel

## Expected frontend flow

1. User selects start point (map click or search)
2. User selects destination
3. User selects profile (default / wheelchair / senior)
4. Frontend sends `POST /route` with `from`, `to`, `profile`
5. Frontend receives geometry and metadata
6. Frontend draws route polyline and POI markers
7. Frontend shows explanation panel

## Example fetch()

```javascript
async function getRoute(from, to, profile = "default") {
  const res = await fetch("http://localhost:3000/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, profile }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const route = await getRoute(
  { lat: 50.087, lon: 14.421 },
  { lat: 50.081, lon: 14.43 },
  "wheelchair"
);
// route.geometry.coordinates -> polyline
// route.nearbyPOI.benches, route.nearbyPOI.wheelchairToilets -> markers
// route.explanation -> UI list
```

## Map libraries

- **GeoJSON coordinates**: `[lon, lat]` (GeoJSON standard)
- **Leaflet**: Uses `[lat, lon]`; convert: `coords.map(([lon, lat]) => [lat, lon])`
- **Mapbox / Google Maps**: Often accept `[lon, lat]` or `{ lng, lat }`; check docs
- **Benches and toilets**: Use as point markers with `poi.lat`, `poi.lon`

## Error handling

| Status | Meaning | Frontend action |
|--------|---------|-----------------|
| 400 | Invalid request (bad from/to/profile) | Show validation message |
| 422 | No route found | Show "No path found" and suggest different points or profile |
| 500 | Internal error | Show generic error, retry or contact support |
| 503 | Service not ready (data not loaded) | Retry after a short delay |
