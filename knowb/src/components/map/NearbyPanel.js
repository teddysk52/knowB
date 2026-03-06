import React, { useMemo } from 'react';
import { MODES, LAYER_CONFIG } from '../../data/modes';
import * as mockData from '../../data/mockData';
import {
  Armchair, Bath, ArrowUpDown, HeartPulse,
  Cross, TrainFront, Droplets, Hospital,
} from 'lucide-react';

const ICON_COMP = {
  Armchair, Bath, ArrowUpDown, HeartPulse,
  Cross, TrainFront, Droplets, Hospital,
};

const DATA_MAP = {
  benches: mockData.benches,
  toilets: mockData.toilets,
  elevators: mockData.elevators,
  aed: mockData.aed,
  pharmacies: mockData.pharmacies,
  transport: mockData.transport,
  fountains: mockData.fountains,
  hospitals: mockData.hospitals,
};

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
        if (dist <= 300) {
          results.push({
            ...item,
            layerKey,
            iconName: config.lucideIcon,
            color: config.color,
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
    <div className="floating-card floating-card--bl" role="complementary" aria-label="Nearby services">
      <div className="floating-card__header">
        <div className="floating-card__title">Nearby</div>
      </div>
      <div className="floating-card__body">
        <ul className="floating-list">
          {nearby.map((item) => {
            const IconComp = ICON_COMP[item.iconName];
            return (
              <li key={`${item.layerKey}-${item.id}`} className="floating-list-item">
                <div
                  className="floating-list-item__icon"
                  style={{ background: item.color }}
                >
                  {IconComp && <IconComp size={16} />}
                </div>
                <div className="floating-list-item__info">
                  <div className="floating-list-item__name">{item.name}</div>
                </div>
                <span className="floating-list-item__distance">{item.distance}m</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
