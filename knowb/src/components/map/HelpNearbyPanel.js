import React, { useMemo } from 'react';
import { HeartPulse, Hospital, Navigation } from 'lucide-react';

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
  if (!data || data.length === 0) return null;
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

export default function HelpNearbyPanel({ mapCenter, userPosition, pragueData, t, onEmergencyRoute }) {
  const center = userPosition || mapCenter;

  const nearestAed = useMemo(
    () => findNearest(pragueData?.aed, center),
    [center, pragueData]
  );
  const nearestClinic = useMemo(
    () => findNearest(pragueData?.clinics, center),
    [center, pragueData]
  );

  const items = [
    { data: nearestAed, Icon: HeartPulse, label: t.nearest_aed, color: '#ef4444' },
    { data: nearestClinic, Icon: Hospital, label: t.nearest_hospital, color: '#ef4444' },
  ];

  return (
    <div className="floating-card floating-card--br" role="complementary" aria-label="Help nearby">
      <div className="floating-card__header">
        <div className="floating-card__title">{t.help_nearby}</div>
      </div>
      <div className="floating-card__body">
        <ul className="floating-list">
          {items.map(({ data, Icon, label, color }) => (
            <li
              key={label}
              className="floating-list-item floating-list-item--clickable"
              onClick={() => data && onEmergencyRoute && onEmergencyRoute(data)}
            >
              <div className="floating-list-item__icon" style={{ background: color }}>
                <Icon size={16} />
              </div>
              <div className="floating-list-item__info">
                <div className="floating-list-item__label">{label}</div>
                <div className="floating-list-item__name">{data?.name || '—'}</div>
              </div>
              <span className="floating-list-item__distance">{data?.distance || '—'}m</span>
              {data && onEmergencyRoute && (
                <span className="floating-list-item__route">
                  <Navigation size={12} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
