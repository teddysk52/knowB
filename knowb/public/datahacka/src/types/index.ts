export interface GeoJsonFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  id?: string | number;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface RoutingFeature {
  id: string;
  coordinates: [number, number][];
  highway: string;
  wheelchair?: string;
  surface?: string;
  smoothness?: string;
  width?: string;
  incline?: string;
  foot?: string;
  access?: string;
  kerb?: string;
  lit?: string;
}

export interface RoutingPointFeature {
  id: string;
  lat: number;
  lon: number;
  highway?: string;
  barrier?: string;
  crossing?: string;
  wheelchair?: string;
  access?: string;
  kerb?: string;
  lit?: string;
}

export interface GraphNode {
  id: string;
  lat: number;
  lon: number;
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  coordinates: [[number, number], [number, number]];
  lengthMeters: number;
  highway: string;
  wheelchair?: string;
  surface?: string;
  smoothness?: string;
  width?: string;
  incline?: string;
  foot?: string;
  access?: string;
  kerb?: string;
  lit?: string;
  isSteps: boolean;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  adjacency: Map<string, string[]>;
  outgoingEdges: Map<string, string[]>;
}

export type POIType = "bench" | "toilet";

export interface POI {
  id: string;
  type: POIType;
  lat: number;
  lon: number;
  wheelchair?: string;
  access?: string;
  fee?: string;
  opening_hours?: string;
  rawProperties: Record<string, unknown>;
}

export type RouteProfile = "default" | "wheelchair" | "senior";

export interface RouteRequest {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  profile: RouteProfile;
}

export interface RouteStats {
  maxInclinePercent: number | null;
  surfaces: string[];
  edgeCount: number;
  stepsCount: number;
  stepsMeters: number;
  litMeters: number;
  unlitMeters: number;
  estimatedDurationMinutes: number;
}

export interface RouteResponse {
  profile: RouteProfile;
  distanceMeters: number;
  cost: number;
  routeStats: RouteStats;
  accessibilityFallback?: boolean;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  edges: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    lengthMeters: number;
    highway: string;
    surface?: string;
    incline?: string;
  }>;
  explanation: string[];
  nearbyPOI: {
    benches: POI[];
    toilets: POI[];
    wheelchairToilets: POI[];
  };
}

export interface FrontendRouteRequestExample {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  profile: "default" | "wheelchair" | "senior";
}

export interface FrontendRouteResponseExample {
  profile: string;
  distanceMeters: number;
  cost: number;
  geometry: { type: "LineString"; coordinates: [number, number][] };
  edges: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    lengthMeters: number;
    highway: string;
    surface?: string;
    incline?: string;
  }>;
  explanation: string[];
  nearbyPOI: {
    benches: POI[];
    toilets: POI[];
    wheelchairToilets: POI[];
  };
}
