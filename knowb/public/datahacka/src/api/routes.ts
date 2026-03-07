import { Router, Request, Response } from "express";
import { RouteRequest, RouteResponse, RouteProfile, POI } from "../types";
import { findRoute } from "../routing/dijkstra";
import { findNearbyPOIs } from "../routing/poi";
import { getBlockingBarrierNodeIds } from "../graph/builder";

const VALID_PROFILES: RouteProfile[] = ["default", "wheelchair", "senior"];

let graphData: {
  graph: import("../types").Graph;
  pois: POI[];
  routingPoints: import("../types").RoutingPointFeature[];
} | null = null;

export function initRoutes(data: typeof graphData) {
  graphData = data;
}

export function createRouter(): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", ready: !!graphData });
  });

  router.post("/route", (req: Request, res: Response) => {
    if (!graphData) {
      res.status(503).json({ error: "Service not ready. Data not loaded." });
      return;
    }

    const body = req.body as Partial<RouteRequest>;
    const from = body.from;
    const to = body.to;
    const profile = body.profile ?? "default";

    if (!from || typeof from.lat !== "number" || typeof from.lon !== "number") {
      res.status(400).json({ error: "Invalid from: must have lat and lon numbers" });
      return;
    }
    if (!to || typeof to.lat !== "number" || typeof to.lon !== "number") {
      res.status(400).json({ error: "Invalid to: must have lat and lon numbers" });
      return;
    }
    if (!VALID_PROFILES.includes(profile)) {
      res.status(400).json({ error: `Invalid profile. Use one of: ${VALID_PROFILES.join(", ")}` });
      return;
    }

    const blockingBarrierNodeIds = getBlockingBarrierNodeIds(
      graphData.routingPoints,
      graphData.graph
    );

    let result = findRoute(
      graphData.graph,
      from.lat,
      from.lon,
      to.lat,
      to.lon,
      profile,
      { blockingBarrierNodeIds, benchesNearEdge: new Set() }
    );

    let accessibilityFallback = false;
    if (!result && profile === "wheelchair") {
      result = findRoute(
        graphData.graph,
        from.lat,
        from.lon,
        to.lat,
        to.lon,
        "default",
        { blockingBarrierNodeIds, benchesNearEdge: new Set() }
      );
      if (result) {
        accessibilityFallback = true;
        result.explanation.unshift(
          "No fully accessible route found. Showing best available path – may include cobblestone, sett or other difficult surfaces."
        );
      }
    }

    if (!result) {
      res.status(422).json({
        error: "Route not found",
        message: "No path found between the given points. Try different start/end or profile.",
      });
      return;
    }

    const nearbyPOI = findNearbyPOIs(result.geometry, graphData.pois);

    if (profile === "wheelchair" && nearbyPOI.wheelchairToilets.length > 0) {
      result.explanation.push("Found wheelchair-accessible toilet near destination");
    }
    if (profile === "senior" && nearbyPOI.benches.length > 0) {
      result.explanation.push("Route passes near benches");
    }

    const response: RouteResponse = {
      profile,
      distanceMeters: result.distanceMeters,
      cost: result.cost,
      routeStats: result.routeStats,
      ...(accessibilityFallback && { accessibilityFallback: true }),
      geometry: {
        type: "LineString",
        coordinates: result.geometry,
      },
      edges: result.edgeIds.map((eid) => {
        const e = graphData!.graph.edges.get(eid)!;
        return {
          id: e.id,
          fromNodeId: e.fromNodeId,
          toNodeId: e.toNodeId,
          lengthMeters: e.lengthMeters,
          highway: e.highway,
          surface: e.surface,
          incline: e.incline,
        };
      }),
      explanation: result.explanation,
      nearbyPOI,
    };

    res.json(response);
  });

  router.get("/poi", (req: Request, res: Response) => {
    if (!graphData) {
      res.status(503).json({ error: "Service not ready. Data not loaded." });
      return;
    }

    const type = req.query.type as string;
    if (type === "bench") {
      res.json({ pois: graphData.pois.filter((p) => p.type === "bench") });
      return;
    }
    if (type === "toilet") {
      res.json({ pois: graphData.pois.filter((p) => p.type === "toilet") });
      return;
    }
    res.json({ pois: graphData.pois });
  });

  return router;
}
