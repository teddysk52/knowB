// ── Real Prague GeoJSON data loader ──────────────────────────────────
// Fetches GeoJSON from /prague-data/, normalizes features to {id, lat, lng, name, ...props}
// Handles Point and Polygon geometries (centroid extraction for polygons)

function getCentroid(coordinates) {
  // For Polygon: coordinates[0] is the outer ring array of [lng, lat]
  const ring = coordinates[0];
  if (!ring || ring.length === 0) return null;
  let sumLng = 0, sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / ring.length, sumLat / ring.length];
}

function extractPoint(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Point') {
    return geometry.coordinates; // [lng, lat]
  }
  if (geometry.type === 'Polygon') {
    return getCentroid(geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    // Use first polygon's centroid
    return getCentroid(geometry.coordinates[0]);
  }
  return null;
}

async function loadGeoJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function normalizeFeatures(geojson, nameField) {
  const features = geojson.features || [];
  return features
    .map((f, i) => {
      const point = extractPoint(f.geometry);
      if (!point) return null;
      const [lng, lat] = point;
      const props = f.properties || {};
      const name = props[nameField] || props.name || props.note || '';
      return { id: props['@id'] || props.objectid || `f${i}`, lat, lng, name, props };
    })
    .filter(Boolean);
}

// ── Backend data (for route comfort calculation) ──
// lavicky = benches, schody = stairs, vytahy = elevators, zachody = toilets

let _backendCache = null;

export async function loadBackendData() {
  if (_backendCache) return _backendCache;

  const [lavicky, schody, vytahy, zachody] = await Promise.all([
    loadGeoJson('/prague-data/backend-data/lavicky.geojson'),
    loadGeoJson('/prague-data/backend-data/schody.geojson'),
    loadGeoJson('/prague-data/backend-data/vytahy.geojson'),
    loadGeoJson('/prague-data/backend-data/zachody.geojson'),
  ]);

  _backendCache = {
    benches: normalizeFeatures(lavicky, 'name'),
    stairs: normalizeFeatures(schody, 'name'),
    elevators: normalizeFeatures(vytahy, 'name'),
    toilets: normalizeFeatures(zachody, 'name'),
  };

  return _backendCache;
}

// ── Frontend data (display-only on map) ──
// aed = defibrillators, kliniki = clinics/hospitals, parkovaniZTP = disabled parking

let _frontendCache = null;

export async function loadFrontendData() {
  if (_frontendCache) return _frontendCache;

  const [aed, kliniki, parkovaniZTP] = await Promise.all([
    loadGeoJson('/prague-data/frontend-data/aed.geojson'),
    loadGeoJson('/prague-data/frontend-data/kliniki.geojson'),
    loadGeoJson('/prague-data/frontend-data/parkovaniZTP.geojson'),
  ]);

  _frontendCache = {
    aed: normalizeFeatures(aed, 'note'),
    clinics: normalizeFeatures(kliniki, 'name'),
    disabledParking: normalizeFeatures(parkovaniZTP, 'name'),
  };

  return _frontendCache;
}

// ── Build GeoJSON FeatureCollection for MapLibre clustering ──
export function toGeoJsonFC(items, layerType) {
  return {
    type: 'FeatureCollection',
    features: items.map((item) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [item.lng, item.lat] },
      properties: {
        id: item.id,
        name: item.name || '',
        layerType,
      },
    })),
  };
}
