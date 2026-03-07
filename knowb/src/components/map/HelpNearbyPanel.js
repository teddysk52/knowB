import React, { useMemo, useState, useEffect } from 'react';
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

async function reverseGeocodeShort(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      { headers: { 'Accept-Language': 'cs,en' } }
    );
    const data = await res.json();
    if (data.address) {
      const road = data.address.road || data.address.pedestrian || data.address.path || '';
      const num = data.address.house_number || '';
      if (road) return num ? `${road} ${num}` : road;
      const sub = data.address.suburb || data.address.neighbourhood || '';
      if (sub) return sub;
    }
    if (data.display_name) return data.display_name.split(',').slice(0, 2).join(', ').trim();
  } catch {}
  return null;
}

function AedName({ data }) {
  const [resolved, setResolved] = useState(null);

  useEffect(() => {
    setResolved(null);
    if (!data) return;
    // Use existing name/note/location fields
    const existing = data.name || data.props?.note || data.props?.['defibrillator:location'] || '';
    if (existing) {
      setResolved(existing);
      return;
    }
    // No name — reverse geocode
    let cancelled = false;
    reverseGeocodeShort(data.lat, data.lng).then(addr => {
      if (!cancelled) setResolved(addr || 'AED');
    });
    return () => { cancelled = true; };
  }, [data?.lat, data?.lng]);

  return <span>{resolved || '…'}</span>;
}

export default function HelpNearbyPanel({ userPosition, pragueData, t, onEmergencyRoute }) {
  const center = userPosition;

  const nearestAed = useMemo(
    () => center ? findNearest(pragueData?.aed, center) : null,
    [center, pragueData]
  );
  const nearestClinic = useMemo(
    () => center ? findNearest(pragueData?.clinics, center) : null,
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
                <div className="floating-list-item__name">
                  {label === t.nearest_aed ? <AedName data={data} /> : (data?.name || '—')}
                </div>
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
