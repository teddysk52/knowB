# Accessible Pedestrian Routing Backend (Prague)

Hackathon MVP backend for accessible pedestrian routing in Prague. Loads a single GeoJSON file, builds a routing graph from pedestrian ways, and computes routes with Dijkstra. Supports wheelchair and senior profiles with hard and soft accessibility filters.

## What it does

- Loads `data/export.geojson` (GeoJSON FeatureCollection from Overpass Turbo)
- Parses LineString features with highway: footway, path, pedestrian, living_street, residential, service, steps
- Builds a bidirectional graph for pathfinding
- Parses POIs: benches and toilets (Point or Polygon centroid)
- Parses optional crossing/barrier Point features
- Computes routes with Dijkstra (not A*)
- Route profiles: default, wheelchair, senior
- Returns route geometry, edges, explanation, and nearby POIs (benches, toilets, wheelchair-accessible toilets)

## Assumptions and limitations

- **Polygon pedestrian areas are ignored** for routing in this MVP. Only LineString features are used.
- Routing network is built only from LineString highway features listed above.
- No database; data stays in memory.
- Suitable for a weekend hackathon; reasonable assumptions and simplifications apply.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Or build and run:

```bash
npm run build
npm start
```

Server runs at `http://localhost:3000` (or `PORT` env var).

**Note:** First startup builds the graph from GeoJSON (can take 4–6 minutes) and saves it to `data/graph-cache.json`. Subsequent startups load from cache in ~10–30 seconds. Delete the cache file to force a rebuild (e.g. after changing export.geojson).

## Data file

Place your GeoJSON export at:

```
data/export.geojson
```

The file must be a GeoJSON FeatureCollection. If missing, the server will fail at startup with a clear error.

## Example request

```bash
curl -X POST http://localhost:3000/route \
  -H "Content-Type: application/json" \
  -d '{
    "from": { "lat": 50.087, "lon": 14.421 },
    "to": { "lat": 50.081, "lon": 14.43 },
    "profile": "wheelchair"
  }'
```

## Endpoints

- `GET /health` – Service status
- `POST /route` – Compute route (body: from, to, profile)
- `GET /poi?type=bench|toilet` – List POIs (optional)

See `src/docs/frontend-integration.md` for frontend integration details.
