import { GraphEdge, RouteProfile } from "../types";
import { parseIncline } from "../utils/incline";
import { config } from "../config";

const BAD_SURFACES = new Set([
  "gravel",
  "cobblestone",
  "sett",
  "unpaved",
  "paving_stones",
  "pebblestone",
  "dirt",
  "sand",
  "dirt/sand",
  "wood",
  "rock",
]);

export interface CostContext {
  benchesNearEdge: Set<string>;
}

export function computeEdgeCost(
  edge: GraphEdge,
  profile: RouteProfile,
  _context: CostContext
): number {
  let cost = edge.lengthMeters;
  const p = config.penalties[profile];

  if (edge.isSteps) {
    cost += p.steps;
  }

  const surface = edge.surface?.toLowerCase();
  if (surface && BAD_SURFACES.has(surface)) {
    cost += p.badSurface;
  }

  const incline = parseIncline(edge.incline);
  if (incline != null && Math.abs(incline) > 5) {
    cost += p.steepIncline;
  }

  if (edge.lit === "no") {
    cost += p.unlit;
  }

  if (edge.kerb === "raised" || edge.kerb === "yes") {
    cost += p.problematicKerb;
  }

  return Math.max(0.1, cost);
}
