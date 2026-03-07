import { haversineDistanceMeters } from "./geo";

const CELL_SIZE = 0.001;

interface NodeEntry {
  id: string;
  lat: number;
  lon: number;
}

export class NodeGrid {
  private grid = new Map<string, NodeEntry[]>();

  build(nodes: Map<string, { lat: number; lon: number }>): void {
    this.grid.clear();
    for (const [id, node] of nodes) {
      const key = this.cellKey(node.lat, node.lon);
      const list = this.grid.get(key) || [];
      list.push({ id, lat: node.lat, lon: node.lon });
      this.grid.set(key, list);
    }
  }

  private cellKey(lat: number, lon: number): string {
    const latCell = Math.floor(lat / CELL_SIZE);
    const lonCell = Math.floor(lon / CELL_SIZE);
    return `${latCell},${lonCell}`;
  }

  findNearest(
    lat: number,
    lon: number,
    maxRadiusMeters: number
  ): string | null {
    const latCell = Math.floor(lat / CELL_SIZE);
    const lonCell = Math.floor(lon / CELL_SIZE);
    const cellRadius = Math.ceil(maxRadiusMeters / (111000 * CELL_SIZE));

    let bestId: string | null = null;
    let bestDist = maxRadiusMeters;

    for (let dl = -cellRadius; dl <= cellRadius; dl++) {
      for (let dc = -cellRadius; dc <= cellRadius; dc++) {
        const key = `${latCell + dl},${lonCell + dc}`;
        const list = this.grid.get(key);
        if (!list) continue;
        for (const node of list) {
          const d = haversineDistanceMeters(lat, lon, node.lat, node.lon);
          if (d < bestDist) {
            bestDist = d;
            bestId = node.id;
          }
        }
      }
    }
    return bestId;
  }
}
