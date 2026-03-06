// Dijkstra-inspired comfort-weighted route scoring
// Uses OSRM for base pedestrian routing, then applies hard/soft filters

const BUFFER_M = 200; // meters — infrastructure search radius

// --- Infrastructure data (Prague) ---
// In production, replace with database / Golemio API queries

const INFRA = {
  benches: [
    { id: 'b1', lat: 50.0875, lng: 14.4213, name: 'Staromestske nam.' },
    { id: 'b2', lat: 50.0812, lng: 14.4283, name: 'Karlovo namesti' },
    { id: 'b3', lat: 50.0765, lng: 14.4145, name: 'Petrin' },
    { id: 'b4', lat: 50.0903, lng: 14.4001, name: 'Letna' },
    { id: 'b5', lat: 50.0788, lng: 14.4189, name: 'Malostranske nam.' },
    { id: 'b6', lat: 50.0841, lng: 14.4518, name: 'Riegrovy sady' },
    { id: 'b7', lat: 50.0922, lng: 14.4455, name: 'Vitkov' },
    { id: 'b8', lat: 50.0678, lng: 14.4301, name: 'Vysehrad' },
    { id: 'b9', lat: 50.0855, lng: 14.4110, name: 'Klarov' },
    { id: 'b10', lat: 50.0750, lng: 14.4380, name: 'Botic' },
    { id: 'b11', lat: 50.0830, lng: 14.4180, name: 'Ujezd' },
    { id: 'b12', lat: 50.0890, lng: 14.4320, name: 'Namesti Republiky' },
  ],
  toilets: [
    { id: 't1', lat: 50.0870, lng: 14.4200, name: 'Stare Mesto' },
    { id: 't2', lat: 50.0820, lng: 14.4270, name: 'Karlovo nam.' },
    { id: 't3', lat: 50.0792, lng: 14.4175, name: 'Mala Strana' },
    { id: 't4', lat: 50.0905, lng: 14.4350, name: 'Florenc' },
    { id: 't5', lat: 50.0733, lng: 14.4188, name: 'Smichov' },
    { id: 't6', lat: 50.0850, lng: 14.4490, name: 'Zizkov' },
    { id: 't7', lat: 50.0801, lng: 14.4320, name: 'Nove Mesto' },
    { id: 't8', lat: 50.0690, lng: 14.4280, name: 'Vysehrad' },
  ],
  elevators: [
    { id: 'e1', lat: 50.0862, lng: 14.4316, name: 'Mustek (metro)' },
    { id: 'e2', lat: 50.0835, lng: 14.4270, name: 'Narodni trida (metro)' },
    { id: 'e3', lat: 50.0905, lng: 14.4345, name: 'Florenc (metro)' },
    { id: 'e4', lat: 50.0755, lng: 14.4175, name: 'Andel (metro)' },
    { id: 'e5', lat: 50.0790, lng: 14.4295, name: 'I.P. Pavlova (metro)' },
    { id: 'e6', lat: 50.0845, lng: 14.4520, name: 'Jiriho z Podebrad (metro)' },
  ],
  aed: [
    { id: 'a1', lat: 50.0878, lng: 14.4205, name: 'Staromestska radnice' },
    { id: 'a2', lat: 50.0830, lng: 14.4290, name: 'Palackeho nam.' },
    { id: 'a3', lat: 50.0860, lng: 14.4315, name: 'Mustek' },
    { id: 'a4', lat: 50.0910, lng: 14.4350, name: 'Florenc' },
    { id: 'a5', lat: 50.0750, lng: 14.4180, name: 'Andel' },
  ],
  pharmacies: [
    { id: 'p1', lat: 50.0868, lng: 14.4250, name: 'Dlouha' },
    { id: 'p2', lat: 50.0815, lng: 14.4300, name: 'Karlovo nam.' },
    { id: 'p3', lat: 50.0840, lng: 14.4410, name: 'Vinohrady' },
    { id: 'p4', lat: 50.0760, lng: 14.4160, name: 'Smichov' },
    { id: 'p5', lat: 50.0900, lng: 14.4120, name: 'Holesovice' },
    { id: 'p6', lat: 50.0695, lng: 14.4310, name: 'Podoli' },
  ],
  transport: [
    { id: 'tr1', lat: 50.0865, lng: 14.4310, name: 'Mustek (A+B)' },
    { id: 'tr2', lat: 50.0838, lng: 14.4265, name: 'Narodni trida (B)' },
    { id: 'tr3', lat: 50.0908, lng: 14.4342, name: 'Florenc (B+C)' },
    { id: 'tr4', lat: 50.0758, lng: 14.4170, name: 'Andel (B)' },
    { id: 'tr5', lat: 50.0793, lng: 14.4290, name: 'I.P. Pavlova (C)' },
    { id: 'tr6', lat: 50.0848, lng: 14.4515, name: 'Jiriho z Podebrad (A)' },
    { id: 'tr7', lat: 50.0870, lng: 14.4188, name: 'Staromestska (tram)' },
    { id: 'tr8', lat: 50.0813, lng: 14.4243, name: 'Narodni divadlo (tram)' },
    { id: 'tr9', lat: 50.0885, lng: 14.4005, name: 'Letenske nam. (tram)' },
    { id: 'tr10', lat: 50.0740, lng: 14.4200, name: 'Ujezd (tram)' },
  ],
  fountains: [
    { id: 'f1', lat: 50.0873, lng: 14.4218, name: 'Staromestske nam.' },
    { id: 'f2', lat: 50.0810, lng: 14.4255, name: 'Narodni trida' },
    { id: 'f3', lat: 50.0785, lng: 14.4185, name: 'Kampa' },
    { id: 'f4', lat: 50.0850, lng: 14.4505, name: 'Riegrovy sady' },
    { id: 'f5', lat: 50.0680, lng: 14.4290, name: 'Vysehrad' },
  ],
  hospitals: [
    { id: 'h1', lat: 50.0755, lng: 14.4280, name: 'Na Frantisku' },
    { id: 'h2', lat: 50.0690, lng: 14.4400, name: 'VFN Vinohrady' },
    { id: 'h3', lat: 50.0715, lng: 14.4260, name: 'Na Karlove' },
    { id: 'h4', lat: 50.0825, lng: 14.4448, name: 'FNKV' },
  ],
};

// --- Profile configuration ---

// Soft filter weights per profile (higher = bigger penalty when missing)
const PROFILE_WEIGHTS = {
  wheelchair: { elevators: 5, toilets: 3, transport: 2, aed: 1.5, benches: 1, pharmacies: 1, fountains: 0.5, hospitals: 1 },
  senior:     { benches: 4, pharmacies: 3, toilets: 2, aed: 2, hospitals: 1.5, fountains: 1, elevators: 0.5, transport: 0.5 },
  tourist:    { transport: 3, toilets: 2, fountains: 1.5, pharmacies: 1, benches: 0.5, aed: 0.5, elevators: 0.5, hospitals: 0.5 },
  standard:   { benches: 1, toilets: 1, elevators: 1, aed: 1, pharmacies: 1, transport: 1, fountains: 1, hospitals: 1 },
};

// Hard requirements per profile — must have at least ONE along route, else huge penalty
const HARD_REQS = {
  wheelchair: ['elevators', 'toilets'],
  senior:     ['benches'],
  tourist:    [],
  standard:   [],
};

// --- Utilities ---

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Segment route coordinates into edges of ~100m each
function segmentRoute(coordinates) {
  const edges = [];
  let accDist = 0;
  let edgeStart = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    accDist += distanceMeters(lat1, lng1, lat2, lng2);

    if (accDist >= 100 || i === coordinates.length - 1) {
      const midIdx = Math.floor((edgeStart + i) / 2);
      const [midLng, midLat] = coordinates[midIdx];
      edges.push({ startIdx: edgeStart, endIdx: i, midLat, midLng, distance: accDist });
      accDist = 0;
      edgeStart = i;
    }
  }
  return edges;
}

// --- Dijkstra-inspired scoring ---

function scoreRoute(routeGeometry, routeDistance, routeDuration, profile, preferences) {
  const coords = routeGeometry.coordinates;
  const edges = segmentRoute(coords);
  const weights = PROFILE_WEIGHTS[profile] || PROFILE_WEIGHTS.standard;
  const hardReqs = HARD_REQS[profile] || [];

  let totalCost = routeDistance; // base cost = raw distance in meters
  const checkpoints = [];
  const warnings = [];
  const factors = {};
  const seenIds = new Set();

  const activePrefs = Object.keys(preferences).filter((k) => preferences[k]);

  activePrefs.forEach((key) => {
    const infraItems = INFRA[key];
    if (!infraItems) return;

    let totalFound = 0;
    let uncoveredDist = 0;
    const weight = weights[key] || 1;

    edges.forEach((edge) => {
      const nearby = infraItems.filter(
        (item) => distanceMeters(edge.midLat, edge.midLng, item.lat, item.lng) <= BUFFER_M
      );

      if (nearby.length > 0) {
        totalFound += nearby.length;
        nearby.forEach((item) => {
          const uid = `${key}-${item.id}`;
          if (!seenIds.has(uid)) {
            seenIds.add(uid);
            checkpoints.push({
              ...item,
              type: key,
              distanceFromRoute: Math.round(
                distanceMeters(edge.midLat, edge.midLng, item.lat, item.lng)
              ),
            });
          }
        });
      } else {
        // Soft filter: penalty = edge_distance × weight × 0.5
        totalCost += edge.distance * weight * 0.5;
        uncoveredDist += edge.distance;
      }
    });

    factors[key] = new Set(
      checkpoints.filter((c) => c.type === key).map((c) => c.id)
    ).size;

    // Hard filter: profile requires this type but ZERO found → huge penalty
    if (hardReqs.includes(key) && preferences[key] && factors[key] === 0) {
      totalCost += routeDistance * 10;
      warnings.push({
        type: 'hard_missing',
        key,
        message: `No ${key} found along this route`,
      });
    }

    // Warning for long uncovered stretches (>500m without this infra)
    if (uncoveredDist > 500 && preferences[key]) {
      warnings.push({
        type: 'sparse',
        key,
        message: `${Math.round(uncoveredDist)}m of route without nearby ${key}`,
      });
    }
  });

  // Comfort score
  const coveredCount = activePrefs.filter((k) => factors[k] > 0).length;
  const coverage = activePrefs.length > 0 ? coveredCount / activePrefs.length : 1;

  let comfortRaw = 50 + coverage * 30;
  Object.values(factors).forEach((count) => {
    if (count >= 3) comfortRaw += 5;
    else if (count >= 1) comfortRaw += 2;
    else comfortRaw -= 3;
  });
  const comfort = Math.min(100, Math.max(10, Math.round(comfortRaw)));

  // Confidence score
  const density = Math.min(15, coords.length / 10);
  const confidence = Math.min(95, Math.max(25, Math.round(40 + coverage * 35 + density)));

  return {
    geometry: routeGeometry,
    distance: routeDistance,
    duration: routeDuration,
    totalCost: Math.round(totalCost),
    checkpoints: checkpoints.sort((a, b) => a.distanceFromRoute - b.distanceFromRoute),
    warnings,
    score: { comfort, confidence, factors },
  };
}

// --- Main entry point ---

async function computeRoute(start, end, profile, preferences) {
  // 1. Get pedestrian routes from OSRM
  const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`;

  const resp = await fetch(osrmUrl);
  if (!resp.ok) throw new Error(`OSRM returned ${resp.status}`);
  const data = await resp.json();

  if (!data.routes || data.routes.length === 0) {
    return { routes: [], bestIndex: 0 };
  }

  // 2. Score each route with Dijkstra-inspired comfort algorithm
  const scored = data.routes.map((route) =>
    scoreRoute(route.geometry, route.distance, route.duration, profile, preferences)
  );

  // 3. Sort by total cost (lowest = best comfort-weighted path)
  scored.sort((a, b) => a.totalCost - b.totalCost);

  return {
    routes: scored,
    bestIndex: 0,
  };
}

module.exports = { computeRoute };
