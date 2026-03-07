import fs from "fs";
import { Graph, GraphNode, GraphEdge, POI, RoutingPointFeature } from "../types";
import { config } from "../config";

interface CacheData {
  nodes: Array<{ id: string; lat: number; lon: number }>;
  edges: GraphEdge[];
  adjacency: Record<string, string[]>;
  outgoingEdges: Record<string, string[]>;
  routingPoints: RoutingPointFeature[];
  pois: POI[];
}

export function loadGraphCache(): { graph: Graph; routingPoints: RoutingPointFeature[]; pois: POI[] } | null {
  const cachePath = config.cacheFile;
  const sourcePath = config.inputFile;

  if (!fs.existsSync(cachePath) || !fs.existsSync(sourcePath)) return null;

  const cacheStat = fs.statSync(cachePath);
  const sourceStat = fs.statSync(sourcePath);
  if (cacheStat.mtimeMs < sourceStat.mtimeMs) return null;

  const raw = fs.readFileSync(cachePath, "utf-8");
  let data: CacheData;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  const nodes = new Map<string, GraphNode>();
  for (const n of data.nodes) {
    nodes.set(n.id, { id: n.id, lat: n.lat, lon: n.lon });
  }

  const edges = new Map<string, GraphEdge>();
  for (const e of data.edges) {
    edges.set(e.id, e);
  }

  const adjacency = new Map<string, string[]>();
  for (const [id, arr] of Object.entries(data.adjacency || {})) {
    adjacency.set(id, arr);
  }

  const outgoingEdges = new Map<string, string[]>();
  for (const [id, arr] of Object.entries(data.outgoingEdges || {})) {
    outgoingEdges.set(id, arr);
  }

  const graph: Graph = { nodes, edges, adjacency, outgoingEdges };
  return { graph, routingPoints: data.routingPoints || [], pois: data.pois || [] };
}

export function saveGraphCache(
  graph: Graph,
  routingPoints: RoutingPointFeature[],
  pois: POI[]
): void {
  const data: CacheData = {
    nodes: Array.from(graph.nodes.values()),
    edges: Array.from(graph.edges.values()),
    adjacency: Object.fromEntries(graph.adjacency),
    outgoingEdges: Object.fromEntries(graph.outgoingEdges),
    routingPoints,
    pois,
  };
  fs.writeFileSync(config.cacheFile, JSON.stringify(data), "utf-8");
}
