import { Graph, GraphEdge, RouteProfile, RouteStats } from "../types";
import { isEdgeAllowed, FilterContext } from "./filters";
import { computeEdgeCost, CostContext } from "./cost";
import { nearestGraphNode } from "../utils/geo";
import { MinHeap } from "../utils/minheap";
import { parseIncline } from "../utils/incline";
import { config } from "../config";

export interface RouteResult {
  nodeIds: string[];
  edgeIds: string[];
  geometry: [number, number][];
  distanceMeters: number;
  cost: number;
  explanation: string[];
  routeStats: RouteStats;
}

export function findRoute(
  graph: Graph,
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  profile: RouteProfile,
  filterContext: FilterContext
): RouteResult | null {
  const nodeMap = new Map<string, { lat: number; lon: number }>();
  for (const [id, n] of graph.nodes) {
    nodeMap.set(id, { lat: n.lat, lon: n.lon });
  }

  const startId = nearestGraphNode(fromLat, fromLon, nodeMap, config.snapRadiusMeters);
  const endId = nearestGraphNode(toLat, toLon, nodeMap, config.snapRadiusMeters);

  if (!startId || !endId) return null;

  const costContext: CostContext = { benchesNearEdge: new Set() };
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const prevEdge = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap();

  dist.set(startId, 0);
  pq.push({ id: startId, cost: 0 });

  while (pq.size > 0) {
    const item = pq.pop()!;
    const u = item.id;
    const uCost = item.cost;
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === endId) break;

    const outEdges = graph.outgoingEdges.get(u) || [];
    for (const edgeId of outEdges) {
      const edge = graph.edges.get(edgeId);
      if (!edge) continue;
      const v = edge.toNodeId;
      if (!isEdgeAllowed(edge, profile, filterContext)) continue;

      const edgeCost = computeEdgeCost(edge, profile, costContext);
      const alt = uCost + edgeCost;
      const vDist = dist.get(v) ?? Infinity;
      if (alt < vDist) {
        dist.set(v, alt);
        prev.set(v, u);
        prevEdge.set(v, edgeId);
        pq.push({ id: v, cost: alt });
      }
    }
  }

  if (!visited.has(endId)) return null;

  const path: string[] = [];
  const edgePath: string[] = [];
  let cur = endId;
  while (cur) {
    path.unshift(cur);
    const e = prevEdge.get(cur);
    if (e) edgePath.unshift(e);
    cur = prev.get(cur) || "";
  }

  if (path[0] !== startId) return null;

  const geometry: [number, number][] = [];
  let distanceMeters = 0;
  let totalCost = 0;
  const explanation: string[] = [];
  let maxInclinePercent: number | null = null;
  const surfacesSet = new Set<string>();
  let stepsCount = 0;
  let stepsMeters = 0;
  let litMeters = 0;
  let unlitMeters = 0;

  if (profile === "wheelchair") {
    explanation.push("Avoided steps for wheelchair profile");
    explanation.push("Avoided inaccessible surfaces (cobblestone, sett, gravel, etc.)");
  }

  for (const eid of edgePath) {
    const edge = graph.edges.get(eid)!;
    const coords = edge.coordinates;
    if (geometry.length === 0) {
      geometry.push(coords[0]);
    }
    geometry.push(coords[1]);
    distanceMeters += edge.lengthMeters;
    totalCost += computeEdgeCost(edge, profile, costContext);

    const inclineVal = parseIncline(edge.incline);
    if (inclineVal != null) {
      const abs = Math.abs(inclineVal);
      if (maxInclinePercent == null || abs > maxInclinePercent) maxInclinePercent = abs;
    }
    if (edge.surface) surfacesSet.add(edge.surface.toLowerCase());
    if (edge.isSteps) {
      stepsCount++;
      stepsMeters += edge.lengthMeters;
    }
    if (edge.lit === "yes") litMeters += edge.lengthMeters;
    else if (edge.lit === "no") unlitMeters += edge.lengthMeters;

    const surface = edge.surface?.toLowerCase();
    if (surface && ["cobblestone", "sett", "gravel", "paving_stones"].includes(surface)) {
      if (!explanation.includes("Penalized cobblestone or sett segments")) {
        explanation.push("Penalized cobblestone or sett segments");
      }
    }
    if (edge.incline && parseFloat(edge.incline)) {
      if (!explanation.includes("Preferred route with lower incline")) {
        explanation.push("Preferred route with lower incline");
      }
    }
  }

  const routeStats: RouteStats = {
    maxInclinePercent,
    surfaces: Array.from(surfacesSet).sort(),
    edgeCount: edgePath.length,
    stepsCount,
    stepsMeters,
    litMeters: Math.round(litMeters * 10) / 10,
    unlitMeters: Math.round(unlitMeters * 10) / 10,
    estimatedDurationMinutes: Math.round((distanceMeters / 80) * 10) / 10,
  };

  return {
    nodeIds: path,
    edgeIds: edgePath,
    geometry,
    distanceMeters,
    cost: totalCost,
    explanation: explanation.length > 0 ? explanation : ["Standard pedestrian route"],
    routeStats,
  };
}
