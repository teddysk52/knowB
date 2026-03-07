# AI Frontend Brief – Accessible Pedestrian Routing (Prague)

This document is for an AI building the frontend. It contains all necessary context, API contracts, and implementation instructions.

---

## Project Overview

**Backend:** Node.js + TypeScript + Express. Accessible pedestrian routing in Prague. Loads GeoJSON from Overpass Turbo, builds a graph, runs Dijkstra. Profiles: default (pedestrian), wheelchair, senior.

**Frontend goal:** Map-based UI where users select start/destination, choose a profile, get a route with geometry, stats, explanation, and nearby POIs (benches, toilets).

**Backend base URL:** `http://localhost:3000` (configurable via env)

---

## API Endpoints

### GET /health

Returns `{ status: "ok", ready: boolean }`. Use to check if backend is ready before routing.

### POST /route

**Request:**
```json
{
  "from": { "lat": 50.087, "lon": 14.421 },
  "to": { "lat": 50.081, "lon": 14.43 },
  "profile": "wheelchair"
}
```

- `from`, `to`: WGS84 coordinates
- `profile`: `"default"` | `"wheelchair"` | `"senior"`

**Success response (200):**
```json
{
  "profile": "wheelchair",
  "distanceMeters": 1155.6,
  "cost": 1420,
  "routeStats": {
    "maxInclinePercent": 4.5,
    "surfaces": ["asphalt", "paving_stones"],
    "edgeCount": 42,
    "stepsCount": 0,
    "stepsMeters": 0,
    "litMeters": 800,
    "unlitMeters": 355.6,
    "estimatedDurationMinutes": 14.4
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
    "Avoided inaccessible surfaces (cobblestone, sett, gravel, etc.)"
  ],
  "nearbyPOI": {
    "benches": [{ "id": "poi_1", "type": "bench", "lat": 50.08, "lon": 14.42 }],
    "toilets": [{ "id": "poi_2", "type": "toilet", "lat": 50.08, "lon": 14.43, "wheelchair": "yes" }],
    "wheelchairToilets": [{ "id": "poi_2", "type": "toilet", "wheelchair": "yes", ... }]
  },
  "accessibilityFallback": false
}
```

**Important fields:**
- `geometry.coordinates`: GeoJSON LineString in `[lon, lat]` order
- `routeStats`: Summary for route summary panel
- `accessibilityFallback`: If `true`, no fully accessible wheelchair route existed; backend returned best available path with a warning (check `routeStats.surfaces` for sett/cobblestone)
- `nearbyPOI.wheelchairToilets`: Toilets with `wheelchair=yes` or `wheelchair=limited`; show with distinct icon

### GET /poi?type=bench|toilet

Returns `{ pois: POI[] }`. Optional; use for preloading all POIs or filtering.

---

## Error Responses

| Status | Body | Action |
|--------|------|--------|
| 400 | `{ error: string }` | Show validation message |
| 422 | `{ error: "Route not found", message: string }` | Show "No path found", suggest different points/profile |
| 500 | `{ error?: string }` | Show generic error |
| 503 | `{ error: string }` | Backend not ready; retry or show "Loading..." |

---

## Frontend Implementation Requirements

### 1. Map

- Use Leaflet, Mapbox, or Google Maps
- Center: Prague (~50.08, 14.42)
- Zoom: suitable for pedestrian routing (e.g. 14–16)

### 2. User Flow

1. User selects start point (map click or search)
2. User selects destination (map click or search)
3. User selects profile: default / wheelchair / senior
4. Frontend sends POST /route
5. Display route polyline, POI markers, route summary, explanation

### 3. Route Display

- Draw `geometry.coordinates` as a polyline
- **Coordinate conversion:** GeoJSON uses `[lon, lat]`. Leaflet uses `[lat, lon]`. Convert: `coords.map(([lon, lat]) => [lat, lon])`
- Style: distinct color for route (e.g. blue)

### 4. POI Markers

- **Benches:** `nearbyPOI.benches` – e.g. bench icon
- **Toilets:** `nearbyPOI.toilets` – generic toilet icon
- **Wheelchair toilets:** `nearbyPOI.wheelchairToilets` – accessibility icon (e.g. wheelchair symbol)
- Position: `poi.lat`, `poi.lon`

### 5. Route Summary Panel

Display:
- Distance: `distanceMeters` (e.g. "1.2 km")
- Duration: `routeStats.estimatedDurationMinutes` (e.g. "~14 min")
- Max incline: `routeStats.maxInclinePercent` (e.g. "Max 4.5% slope" or "Unknown")
- Surfaces: `routeStats.surfaces` (e.g. "asphalt, paving_stones")
- Steps: `routeStats.stepsCount` / `routeStats.stepsMeters` (if > 0)
- Lit/unlit: `routeStats.litMeters` / `routeStats.unlitMeters` (e.g. "800 m lit, 356 m unlit")

### 6. Accessibility Fallback Warning

If `accessibilityFallback === true`:
- Show prominent warning: "No fully accessible route found. This path may include cobblestone or other difficult surfaces."
- Optionally highlight `routeStats.surfaces` for sett/cobblestone

### 7. Explanation Panel

- List `explanation` as bullet points or short messages
- Examples: "Avoided steps for wheelchair profile", "Penalized cobblestone or sett segments"

### 8. Profile Selection

- Default: standard pedestrian
- Wheelchair: avoids steps, excludes cobblestone/sett; may fall back to best available path
- Senior: penalizes steps and bad surfaces; prefers benches nearby

---

## Example fetch()

```javascript
const API_BASE = "http://localhost:3000";

async function getRoute(from, to, profile = "default") {
  const res = await fetch(`${API_BASE}/route`, {
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

// Usage
const route = await getRoute(
  { lat: 50.087, lon: 14.421 },
  { lat: 50.081, lon: 14.43 },
  "wheelchair"
);
// route.geometry.coordinates -> polyline
// route.nearbyPOI.benches, route.nearbyPOI.wheelchairToilets -> markers
// route.explanation -> UI list
// route.routeStats -> summary panel
```

---

## TypeScript Types (for frontend)

```typescript
type RouteProfile = "default" | "wheelchair" | "senior";

interface RouteRequest {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  profile: RouteProfile;
}

interface RouteStats {
  maxInclinePercent: number | null;
  surfaces: string[];
  edgeCount: number;
  stepsCount: number;
  stepsMeters: number;
  litMeters: number;
  unlitMeters: number;
  estimatedDurationMinutes: number;
}

interface POI {
  id: string;
  type: "bench" | "toilet";
  lat: number;
  lon: number;
  wheelchair?: string;
  access?: string;
  fee?: string;
  opening_hours?: string;
}

interface RouteResponse {
  profile: RouteProfile;
  distanceMeters: number;
  cost: number;
  routeStats: RouteStats;
  accessibilityFallback?: boolean;
  geometry: { type: "LineString"; coordinates: [number, number][] };
  edges: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    lengthMeters: number;
    highway: string;
    surface?: string;
    incline?: string;
  }>;
  explanation: string[];
  nearbyPOI: {
    benches: POI[];
    toilets: POI[];
    wheelchairToilets: POI[];
  };
}
```

---

## Tech Stack Suggestions

- **React** or **Vue** for UI
- **Leaflet** + **react-leaflet** (or vue2-leaflet) for map
- **Vite** for build
- **Tailwind CSS** or similar for styling

---

## Checklist for AI

- [ ] Map centered on Prague with click-to-select start/destination
- [ ] Profile selector (default, wheelchair, senior)
- [ ] POST /route on button click
- [ ] Draw route polyline from geometry.coordinates
- [ ] Show POI markers (benches, toilets, wheelchairToilets with distinct icon)
- [ ] Route summary panel (distance, duration, max incline, surfaces, steps, lit/unlit)
- [ ] Explanation panel
- [ ] Accessibility fallback warning when `accessibilityFallback === true`
- [ ] Error handling for 400, 422, 500, 503
- [ ] Loading state while fetching
