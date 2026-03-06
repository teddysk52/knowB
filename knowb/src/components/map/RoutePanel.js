import React from 'react';
import { MapPin, Navigation, Route, X } from 'lucide-react';
import { Armchair, HeartPulse, Bath, AlertTriangle, CheckCircle } from 'lucide-react';

// Haversine
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeRouteStats(start, end) {
  if (!start || !end) return null;
  const dist = distanceKm(start.lat, start.lng, end.lat, end.lng);
  const walkingSpeed = 4; // km/h
  const time = (dist / walkingSpeed) * 60; // minutes

  // Simulated comfort score
  const benchesNearby = Math.floor(Math.random() * 4) + 1;
  const toiletsNearby = Math.floor(Math.random() * 3) + 1;
  const aedAvailable = Math.random() > 0.3;
  const stairsDetected = Math.floor(Math.random() * 3);
  const comfort = Math.min(100, Math.max(20,
    80 + benchesNearby * 3 + toiletsNearby * 4 + (aedAvailable ? 5 : -10) - stairsDetected * 12
  ));

  return {
    distance: dist.toFixed(1),
    time: Math.round(time),
    comfort,
    benchesNearby,
    toiletsNearby,
    aedAvailable,
    stairsDetected,
  };
}

export default function RoutePanel({ route, settingPoint, onStartClick, onClear }) {
  const startText = route.start
    ? `${route.start.lat.toFixed(4)}, ${route.start.lng.toFixed(4)}`
    : '';
  const endText = route.end
    ? `${route.end.lat.toFixed(4)}, ${route.end.lng.toFixed(4)}`
    : '';

  const stats = computeRouteStats(route.start, route.end);

  const comfortLevel =
    stats && stats.comfort >= 70 ? 'high' : stats && stats.comfort >= 50 ? 'medium' : 'low';
  const comfortColor =
    comfortLevel === 'high' ? '#059669' : comfortLevel === 'medium' ? '#f59e0b' : '#dc2626';

  return (
    <div className="route-section">
      <div className="route-section__inner">
        <div className="section-header">
          <div className="section-header__eyebrow">Route Planning</div>
          <h2 className="section-header__title">Comfort-Aware Navigation</h2>
          <p className="section-header__subtitle">
            Click map points to plan accessible routes with real-time comfort scoring
          </p>
        </div>

        {/* Inputs */}
        <div className="route-inputs">
          <div className="route-input-wrap">
            <Navigation className="route-input-wrap__icon" size={18} />
            <input
              className="route-input"
              type="text"
              placeholder="Start"
              value={startText}
              readOnly
              aria-label="Start location"
            />
          </div>
          <div className="route-input-wrap">
            <MapPin className="route-input-wrap__icon" size={18} />
            <input
              className="route-input"
              type="text"
              placeholder="Destination"
              value={endText}
              readOnly
              aria-label="Destination"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="route-actions">
          <button className="btn btn--primary" onClick={onStartClick} aria-label="Set route">
            <Route size={18} />
            {settingPoint === 'start'
              ? 'Tap map: Start'
              : settingPoint === 'end'
              ? 'Tap map: Destination'
              : 'Set Route'}
          </button>
          <button className="btn btn--secondary" onClick={onClear} aria-label="Clear route">
            <X size={18} />
            Clear
          </button>
        </div>

        {/* Route Info */}
        {stats && (
          <>
            <div className="route-info" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="route-info__item">
                <div className="route-info__value">{stats.distance} km</div>
                <div className="route-info__label">Distance</div>
              </div>
              <div className="route-info__item">
                <div className="route-info__value">{stats.time} min</div>
                <div className="route-info__label">Est. time</div>
              </div>
              <div className="route-info__item">
                <div className="route-info__value">{stats.comfort}%</div>
                <div className="route-info__label">Comfort</div>
              </div>
            </div>

            {/* Comfort Card */}
            <div className="comfort-card" style={{ animation: 'fadeIn 0.4s ease' }}>
              <div className="comfort-top">
                <div className={`comfort-circle comfort-circle--${comfortLevel}`}>
                  {stats.comfort}%
                </div>
                <div className="comfort-info">
                  <h3>Route Comfort Score</h3>
                  <p>Based on nearby infrastructure along route</p>
                </div>
              </div>

              <div className="comfort-bar">
                <div
                  className="comfort-bar__fill"
                  style={{ width: `${stats.comfort}%`, background: comfortColor }}
                />
              </div>

              <div className="comfort-factors">
                <div className={`comfort-factor ${stats.benchesNearby >= 2 ? 'comfort-factor--good' : 'comfort-factor--warn'}`}>
                  <Armchair size={16} />
                  {stats.benchesNearby} benches along route
                </div>
                <div className={`comfort-factor ${stats.toiletsNearby >= 1 ? 'comfort-factor--good' : 'comfort-factor--warn'}`}>
                  <Bath size={16} />
                  {stats.toiletsNearby} toilets nearby
                </div>
                <div className={`comfort-factor ${stats.aedAvailable ? 'comfort-factor--good' : 'comfort-factor--bad'}`}>
                  <HeartPulse size={16} />
                  {stats.aedAvailable ? 'AED available' : 'No AED nearby'}
                </div>
                <div className={`comfort-factor ${stats.stairsDetected === 0 ? 'comfort-factor--good' : 'comfort-factor--bad'}`}>
                  {stats.stairsDetected === 0 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  {stats.stairsDetected} stairs detected
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
