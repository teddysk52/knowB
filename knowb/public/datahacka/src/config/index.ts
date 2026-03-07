import path from "path";

export const config = {
  inputFile: path.join(process.cwd(), "data", "export.geojson"),
  cacheFile: path.join(process.cwd(), "data", "graph-cache.json"),
  snapRadiusMeters: 50,
  poiSearchRadiusMeters: 100,
  maxInclinePercentWheelchair: 6,
  wheelchairExcludedSurfaces: [
    "sett",
    "cobblestone",
    "gravel",
    "unpaved",
    "dirt",
    "sand",
    "dirt/sand",
    "pebblestone",
    "wood",
    "rock",
  ],
  penalties: {
    default: {
      badSurface: 20,
      steepIncline: 15,
      unlit: 5,
      steps: 0,
      problematicKerb: 10,
      benchBonus: 0,
    },
    wheelchair: {
      badSurface: 150,
      steepIncline: 200,
      unlit: 10,
      steps: Infinity,
      problematicKerb: 50,
      benchBonus: 0,
    },
    senior: {
      badSurface: 40,
      steepIncline: 60,
      unlit: 8,
      steps: 80,
      problematicKerb: 25,
      benchBonus: -5,
    },
  },
};
