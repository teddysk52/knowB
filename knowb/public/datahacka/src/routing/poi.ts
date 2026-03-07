import { POI } from "../types";
import { distanceToRouteMeters } from "../utils/geo";
import { config } from "../config";

export function findNearbyPOIs(
  routeCoords: [number, number][],
  pois: POI[]
): { benches: POI[]; toilets: POI[]; wheelchairToilets: POI[] } {
  const radius = config.poiSearchRadiusMeters;
  const benches: POI[] = [];
  const toilets: POI[] = [];
  const wheelchairToilets: POI[] = [];

  for (const poi of pois) {
    const dist = distanceToRouteMeters(poi.lat, poi.lon, routeCoords);
    if (dist > radius) continue;

    if (poi.type === "bench") {
      benches.push(poi);
    } else if (poi.type === "toilet") {
      toilets.push(poi);
      if (poi.wheelchair === "yes") {
        wheelchairToilets.push(poi);
      } else if (poi.wheelchair === "limited") {
        wheelchairToilets.push({ ...poi, rawProperties: { ...poi.rawProperties, accessibility: "limited" } });
      }
    }
  }

  return { benches, toilets, wheelchairToilets };
}
