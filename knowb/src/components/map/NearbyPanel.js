import React, { useMemo } from 'react';
import { MODES, LAYER_CONFIG } from '../../data/modes';
import * as mockData from '../../data/mockData';

const DATA_MAP = {
  benches: mockData.benches,
  toilets: mockData.toilets,
  elevators: mockData.elevators,
  aed: mockData.aed,
  pharmacies: mockData.pharmacies,
  transport: mockData.transport,
  fountains: mockData.fountains,
  hospitals: mockData.hospitals,
  playgrounds: mockData.playgrounds,
  landmarks: mockData.landmarks,
};

// Haversine distance in meters
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyPanel({ activeMode, mapCenter }) {
  const RADIUS = 200; // meters

  const nearby = useMemo(() => {
    if (!mapCenter) return [];
    const modeConfig = MODES[activeMode];
    const results = [];

    modeConfig.layers.forEach((layerKey) => {
      const data = DATA_MAP[layerKey];
      const config = LAYER_CONFIG[layerKey];
      if (!data || !config) return;

      data.forEach((item) => {
        const dist = distanceMeters(mapCenter.lat, mapCenter.lng, item.lat, item.lng);
        if (dist <= RADIUS) {
          results.push({
            ...item,
            layerKey,
            icon: config.icon,
            label: config.label,
            distance: Math.round(dist),
          });
        }
      });
    });

    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, 5);
  }, [activeMode, mapCenter]);

  if (nearby.length === 0) return null;

  return (
    <div className="nearby-panel" role="complementary" aria-label="Nearby services">
      <div className="nearby-panel__title">Nearby</div>
      <ul className="nearby-panel__list">
        {nearby.map((item) => (
          <li key={`${item.layerKey}-${item.id}`} className="nearby-item">
            <span className="nearby-item__icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            <span className="nearby-item__distance">{item.distance}m</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
