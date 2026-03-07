import fs from "fs";
import path from "path";
import { GeoJsonFeature, GeoJsonFeatureCollection } from "../types";
import { config } from "../config";

export function loadExportGeoJson(): GeoJsonFeatureCollection {
  const filePath = config.inputFile;
  if (!fs.existsSync(filePath)) {
    throw new Error(`GeoJSON file not found: ${filePath}. Place export.geojson in data/ folder.`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${filePath}`);
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as { type?: string }).type !== "FeatureCollection"
  ) {
    throw new Error("GeoJSON must be a FeatureCollection");
  }
  const fc = parsed as GeoJsonFeatureCollection;
  if (!Array.isArray(fc.features)) {
    throw new Error("FeatureCollection must have a features array");
  }
  return fc;
}
