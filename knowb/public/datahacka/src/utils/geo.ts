const EARTH_RADIUS_METERS = 6371000;

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function nearestGraphNode(
  lat: number,
  lon: number,
  nodes: Map<string, { lat: number; lon: number }>,
  maxRadiusMeters: number
): string | null {
  let bestId: string | null = null;
  let bestDist = maxRadiusMeters;

  for (const [id, node] of nodes) {
    const d = haversineDistanceMeters(lat, lon, node.lat, node.lon);
    if (d < bestDist) {
      bestDist = d;
      bestId = id;
    }
  }
  return bestId;
}

export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

export function distanceToRouteMeters(
  lat: number,
  lon: number,
  routeCoords: [number, number][]
): number {
  let minDist = Infinity;
  for (const [rLon, rLat] of routeCoords) {
    const d = haversineDistanceMeters(lat, lon, rLat, rLon);
    if (d < minDist) minDist = d;
  }
  return minDist;
}
