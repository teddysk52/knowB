import React, { useMemo } from 'react';
import { HeartPulse, Cross, Hospital } from 'lucide-react';
import * as mockData from '../../data/mockData';

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

function findNearest(data, center) {
  let nearest = null;
  let minDist = Infinity;
  data.forEach((item) => {
    const d = distanceMeters(center.lat, center.lng, item.lat, item.lng);
    if (d < minDist) {
      minDist = d;
      nearest = { ...item, distance: Math.round(d) };
    }
  });
  return nearest;
}

export default function HelpNearbyPanel({ mapCenter }) {
  const nearestAed = useMemo(() => findNearest(mockData.aed, mapCenter), [mapCenter]);
  const nearestPharmacy = useMemo(() => findNearest(mockData.pharmacies, mapCenter), [mapCenter]);
  const nearestHospital = useMemo(() => findNearest(mockData.hospitals, mapCenter), [mapCenter]);

  const items = [
    { data: nearestAed, Icon: HeartPulse, label: 'Nearest AED', color: '#DC2626' },
    { data: nearestPharmacy, Icon: Cross, label: 'Nearest Pharmacy', color: '#059669' },
    { data: nearestHospital, Icon: Hospital, label: 'Nearest Hospital', color: '#E11D48' },
  ];

  return (
    <div className="floating-card floating-card--br" role="complementary" aria-label="Help nearby">
      <div className="floating-card__header">
        <div className="floating-card__title">Help Nearby</div>
      </div>
      <div className="floating-card__body">
        <ul className="floating-list">
          {items.map(({ data, Icon, label, color }) => (
            <li key={label} className="floating-list-item">
              <div className="floating-list-item__icon" style={{ background: color }}>
                <Icon size={16} />
              </div>
              <div className="floating-list-item__info">
                <div className="floating-list-item__label">{label}</div>
                <div className="floating-list-item__name">{data?.name || '—'}</div>
              </div>
              <span className="floating-list-item__distance">{data?.distance || '—'}m</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
