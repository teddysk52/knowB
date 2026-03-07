import { createApp } from "./app";
import { initRoutes } from "./api/routes";
import { loadExportGeoJson } from "./loaders/geojson";
import { buildGraph, getBlockingBarrierNodeIds } from "./graph/builder";
import { loadGraphCache, saveGraphCache } from "./loaders/cache";

const PORT = process.env.PORT || 3000;

function main() {
  let graph: import("./types").Graph;
  let routingPoints: import("./types").RoutingPointFeature[];
  let pois: import("./types").POI[];

  const cached = loadGraphCache();
  if (cached) {
    console.log("Loading graph from cache...");
    const start = Date.now();
    graph = cached.graph;
    routingPoints = cached.routingPoints;
    pois = cached.pois;
    console.log(`Loaded in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  } else {
    const startLoad = Date.now();
    console.log("Loading GeoJSON...");
    const fc = loadExportGeoJson();
    console.log(`Loaded ${fc.features.length.toLocaleString()} features in ${((Date.now() - startLoad) / 1000).toFixed(1)}s`);

    console.log("Building graph...");
    const startBuild = Date.now();
    const result = buildGraph(
      fc.features,
      (processed, total, nodes, edges) => {
        const pct = Math.round((processed / total) * 100);
        const elapsed = ((Date.now() - startBuild) / 1000).toFixed(1);
        console.log(`  ${processed}/${total} (${pct}%) - nodes: ${nodes.toLocaleString()}, edges: ${edges.toLocaleString()} - ${elapsed}s`);
      },
      (processed, total) => {
        const elapsed = ((Date.now() - startBuild) / 1000).toFixed(1);
        console.log(`  Attaching routing points: ${processed}/${total} - ${elapsed}s`);
      }
    );
    graph = result.graph;
    routingPoints = result.routingPoints;
    pois = result.pois;
    console.log(`Graph built in ${((Date.now() - startBuild) / 1000).toFixed(1)}s`);

    const startCache = Date.now();
    console.log("Saving cache...");
    saveGraphCache(graph, routingPoints, pois);
    console.log(`Cache saved in ${((Date.now() - startCache) / 1000).toFixed(1)}s`);
  }

  console.log(`Graph nodes: ${graph.nodes.size}`);
  console.log(`Graph edges: ${graph.edges.size}`);
  console.log(`Crossing/barrier points: ${routingPoints.length}`);
  console.log(`Benches: ${pois.filter((p) => p.type === "bench").length}`);
  console.log(`Toilets: ${pois.filter((p) => p.type === "toilet").length}`);

  initRoutes({ graph, pois, routingPoints });

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Endpoints: GET /health, POST /route, GET /poi");
  });
}

try {
  main();
} catch (err) {
  console.error("Startup failed:", err);
  process.exit(1);
}
