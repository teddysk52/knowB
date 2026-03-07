import { GraphEdge, RouteProfile } from "../types";
import { parseIncline } from "../utils/incline";
import { config } from "../config";

export interface FilterContext {
  blockingBarrierNodeIds: Set<string>;
  benchesNearEdge: Set<string>;
}

export function isEdgeAllowed(
  edge: GraphEdge,
  profile: RouteProfile,
  context: FilterContext
): boolean {
  if (profile === "wheelchair") {
    if (edge.isSteps) return false;
    if (edge.wheelchair === "no") return false;
    if (edge.access === "no") return false;
    if (edge.foot === "no") return false;
    const surface = edge.surface?.toLowerCase();
    if (surface && config.wheelchairExcludedSurfaces.includes(surface)) return false;
    const incline = parseIncline(edge.incline);
    if (incline != null && Math.abs(incline) > config.maxInclinePercentWheelchair) {
      return false;
    }
    if (context.blockingBarrierNodeIds.has(edge.fromNodeId) || context.blockingBarrierNodeIds.has(edge.toNodeId)) {
      return false;
    }
  }
  return true;
}
