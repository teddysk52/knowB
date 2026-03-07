import { GeoJsonFeature, Graph, GraphEdge, GraphNode, POI, POIType, RoutingPointFeature } from "../types";
import { haversineDistanceMeters } from "../utils/geo";
import { NodeGrid } from "../utils/nodegrid";
import { config } from "../config";

const ROUTING_HIGHWAYS = new Set([
  "footway",
  "path",
  "pedestrian",
  "living_street",
  "residential",
  "service",
  "steps",
]);

const BLOCKING_BARRIERS = new Set(["turnstile", "stile", "cycle_barrier", "block"]);

function nodeId(lon: number, lat: number): string {
  return `n_${lon.toFixed(7)}_${lat.toFixed(7)}`;
}

function edgeId(from: string, to: string, idx: number): string {
  return `e_${from}_${to}_${idx}`;
}

function getProp(props: Record<string, unknown>, key: string): string | undefined {
  const v = props[key];
  return typeof v === "string" ? v : undefined;
}

function getCoords(f: GeoJsonFeature): [number, number][] | null {
  const g = f.geometry;
  if (!g || !g.coordinates) return null;
  const c = g.coordinates;
  if (Array.isArray(c) && c.length > 0) {
    const first = c[0];
    if (typeof first === "number") {
      return [[c[0] as number, c[1] as number]];
    }
    if (Array.isArray(first) && typeof first[0] === "number") {
      return c as [number, number][];
    }
    if (Array.isArray(first) && Array.isArray(first[0])) {
      const ring = (c as number[][][])[0];
      return ring as [number, number][];
    }
  }
  return null;
}

function polygonCentroid(coords: number[][][]): [number, number] | null {
  const ring = coords[0];
  if (!ring || ring.length < 3) return null;
  let sumLon = 0;
  let sumLat = 0;
  for (const p of ring) {
    sumLon += p[0];
    sumLat += p[1];
  }
  return [sumLon / ring.length, sumLat / ring.length];
}

const PROGRESS_INTERVAL = 20000;

const ROUTING_POINTS_PROGRESS_INTERVAL = 500;

export function buildGraph(
  features: GeoJsonFeature[],
  onProgress?: (processed: number, total: number, nodes: number, edges: number) => void,
  onRoutingPointsProgress?: (processed: number, total: number) => void
): {
  graph: Graph;
  routingPoints: RoutingPointFeature[];
  pois: POI[];
} {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const adjacency = new Map<string, string[]>();
  const outgoingEdges = new Map<string, string[]>();
  const routingPoints: RoutingPointFeature[] = [];
  const pois: POI[] = [];
  let poiId = 0;
  const total = features.length;

  for (let idx = 0; idx < features.length; idx++) {
    const f = features[idx];
    if (onProgress && idx > 0 && idx % PROGRESS_INTERVAL === 0) {
      onProgress(idx, total, nodes.size, edges.size);
    }
    try {
      const props = f.properties || {};
      const highway = getProp(props, "highway");
      const amenity = getProp(props, "amenity");
      const barrier = getProp(props, "barrier");
      const geomType = f.geometry?.type;

      if (amenity === "bench" || amenity === "toilets") {
        const coords = getCoords(f);
        let lat: number, lon: number;
        if (coords && coords.length > 0) {
          if (typeof coords[0][0] === "number") {
            [lon, lat] = coords[0];
          } else {
            continue;
          }
        } else if (geomType === "Polygon" && f.geometry?.coordinates) {
          const centroid = polygonCentroid(f.geometry.coordinates as number[][][]);
          if (!centroid) continue;
          [lon, lat] = centroid;
        } else {
          continue;
        }
        const poi: POI = {
          id: `poi_${poiId++}`,
          type: amenity as POIType,
          lat,
          lon,
          wheelchair: getProp(props, "wheelchair"),
          access: getProp(props, "access"),
          fee: getProp(props, "fee"),
          opening_hours: getProp(props, "opening_hours"),
          rawProperties: props as Record<string, unknown>,
        };
        pois.push(poi);
        continue;
      }

      if (geomType === "Point" && (highway === "crossing" || barrier)) {
        const c = f.geometry.coordinates as number[];
        if (Array.isArray(c) && c.length >= 2) {
          routingPoints.push({
            id: `rp_${routingPoints.length}`,
            lon: c[0],
            lat: c[1],
            highway,
            barrier,
            crossing: getProp(props, "crossing"),
            wheelchair: getProp(props, "wheelchair"),
            access: getProp(props, "access"),
            kerb: getProp(props, "kerb"),
            lit: getProp(props, "lit"),
          });
        }
        continue;
      }

      if (geomType !== "LineString") continue;
      if (!highway || !ROUTING_HIGHWAYS.has(highway)) continue;

      const coords = getCoords(f);
      if (!coords || coords.length < 2) continue;

      const isSteps = highway === "steps";

      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];
        const fromId = nodeId(lon1, lat1);
        const toId = nodeId(lon2, lat2);

        if (!nodes.has(fromId)) {
          nodes.set(fromId, { id: fromId, lat: lat1, lon: lon1 });
        }
        if (!nodes.has(toId)) {
          nodes.set(toId, { id: toId, lat: lat2, lon: lon2 });
        }

        const lengthMeters = haversineDistanceMeters(lat1, lon1, lat2, lon2);
        const edge: GraphEdge = {
          id: edgeId(fromId, toId, i),
          fromNodeId: fromId,
          toNodeId: toId,
          coordinates: [[lon1, lat1], [lon2, lat2]],
          lengthMeters,
          highway,
          wheelchair: getProp(props, "wheelchair"),
          surface: getProp(props, "surface"),
          smoothness: getProp(props, "smoothness"),
          width: getProp(props, "width"),
          incline: getProp(props, "incline"),
          foot: getProp(props, "foot"),
          access: getProp(props, "access"),
          kerb: getProp(props, "kerb"),
          lit: getProp(props, "lit"),
          isSteps,
        };
        edges.set(edge.id, edge);

        const revId = edgeId(toId, fromId, i);
        const revEdge: GraphEdge = {
          ...edge,
          id: revId,
          fromNodeId: toId,
          toNodeId: fromId,
          coordinates: [[lon2, lat2], [lon1, lat1]],
        };
        edges.set(revId, revEdge);

        const fromAdj = adjacency.get(fromId) || [];
        if (!fromAdj.includes(toId)) fromAdj.push(toId);
        adjacency.set(fromId, fromAdj);
        const fromOut = outgoingEdges.get(fromId) || [];
        if (!fromOut.includes(edge.id)) fromOut.push(edge.id);
        outgoingEdges.set(fromId, fromOut);

        const toAdj = adjacency.get(toId) || [];
        if (!toAdj.includes(fromId)) toAdj.push(fromId);
        adjacency.set(toId, toAdj);
        const toOut = outgoingEdges.get(toId) || [];
        if (!toOut.includes(revId)) toOut.push(revId);
        outgoingEdges.set(toId, toOut);
      }
    } catch {
      continue;
    }
  }

  if (onProgress) {
    onProgress(total, total, nodes.size, edges.size);
  }

  const nodeMap = new Map<string, { lat: number; lon: number }>();
  for (const [id, n] of nodes) {
    nodeMap.set(id, { lat: n.lat, lon: n.lon });
  }

  const nodeGrid = new NodeGrid();
  nodeGrid.build(nodeMap);

  const rpTotal = routingPoints.length;
  if (onRoutingPointsProgress && rpTotal > 0) {
    onRoutingPointsProgress(0, rpTotal);
  }
  for (let i = 0; i < routingPoints.length; i++) {
    const rp = routingPoints[i];
    const nearest = nodeGrid.findNearest(rp.lat, rp.lon, 20);
    if (nearest) {
      (rp as RoutingPointFeature & { attachedNodeId?: string }).attachedNodeId = nearest;
    }
    if (onRoutingPointsProgress && (i + 1) % ROUTING_POINTS_PROGRESS_INTERVAL === 0) {
      onRoutingPointsProgress(i + 1, rpTotal);
    }
  }
  if (onRoutingPointsProgress && rpTotal > 0) {
    onRoutingPointsProgress(rpTotal, rpTotal);
  }

  const graph: Graph = { nodes, edges, adjacency, outgoingEdges };
  return { graph, routingPoints, pois };
}

export function getBlockingBarrierNodeIds(
  routingPoints: RoutingPointFeature[],
  graph: Graph
): Set<string> {
  const blocking = new Set<string>();
  for (const rp of routingPoints) {
    const attached = (rp as RoutingPointFeature & { attachedNodeId?: string }).attachedNodeId;
    if (attached && rp.barrier && BLOCKING_BARRIERS.has(rp.barrier)) {
      blocking.add(attached);
    }
  }
  return blocking;
}
