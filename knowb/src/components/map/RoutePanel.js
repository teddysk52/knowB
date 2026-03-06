import React from 'react';
import {
  Navigation, MapPin, Route, X,
  Armchair, Bath, ArrowUpDown, HeartPulse,
  Cross, TrainFront, Droplets, Shield,
} from 'lucide-react';

const PREF_OPTIONS = [
  { key: 'benches', label: 'Benches', Icon: Armchair },
  { key: 'toilets', label: 'Toilets', Icon: Bath },
  { key: 'elevators', label: 'Elevators', Icon: ArrowUpDown },
  { key: 'aed', label: 'AED', Icon: HeartPulse },
  { key: 'pharmacies', label: 'Pharmacies', Icon: Cross },
  { key: 'fountains', label: 'Water', Icon: Droplets },
  { key: 'transport', label: 'Transit', Icon: TrainFront },
];

const FACTOR_LABELS = {
  benches: 'Benches',
  toilets: 'Toilets',
  elevators: 'Elevators',
  aed: 'AED points',
  pharmacies: 'Pharmacies',
  fountains: 'Fountains',
  transport: 'Transit stops',
};

export default function RoutePanel({
  route, settingPoint, onStartClick, onClear,
  routeData, selectedRouteIndex, onRouteSelect,
  isLoadingRoute, comfortData, preferences, onTogglePref,
}) {
  const startText = route.start ? route.start.address : '';
  const endText = route.end ? route.end.address : '';
  const hasRoute = routeData && routeData.length > 0;
  const selected = hasRoute ? routeData[selectedRouteIndex] : null;

  const comfortLevel = comfortData
    ? comfortData.comfort >= 70 ? 'high' : comfortData.comfort >= 50 ? 'medium' : 'low'
    : null;
  const jistotaLevel = comfortData
    ? comfortData.jistota >= 70 ? 'high' : comfortData.jistota >= 50 ? 'medium' : 'low'
    : null;

  return (
    <div className="route-section">
      <div className="route-section__inner">
        <div className="section-header">
          <div className="section-header__eyebrow">Route Planning</div>
          <h2 className="section-header__title">Comfort-Aware Navigation</h2>
        </div>

        {/* Inputs */}
        <div className="route-inputs">
          <div className="route-input-wrap">
            <Navigation className="route-input-wrap__icon" size={16} />
            <input
              className="route-input"
              type="text"
              placeholder="Point A"
              value={startText}
              readOnly
              aria-label="Start location"
            />
          </div>
          <div className="route-input-wrap">
            <MapPin className="route-input-wrap__icon" size={16} />
            <input
              className="route-input"
              type="text"
              placeholder="Point B"
              value={endText}
              readOnly
              aria-label="Destination"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="route-actions">
          <button className="btn btn--primary" onClick={onStartClick}>
            <Route size={16} />
            {settingPoint === 'start'
              ? 'Tap map: Start'
              : settingPoint === 'end'
              ? 'Tap map: Destination'
              : 'Set Route'}
          </button>
          <button className="btn btn--secondary" onClick={onClear}>
            <X size={16} />
            Clear
          </button>
        </div>

        {/* What matters on your route */}
        <div className="pref-section">
          <div className="pref-section__label">What matters on your route</div>
          <div className="pref-grid">
            {PREF_OPTIONS.map(({ key, label, Icon }) => (
              <label
                key={key}
                className={`pref-chip ${preferences[key] ? 'pref-chip--active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={preferences[key] || false}
                  onChange={() => onTogglePref(key)}
                  className="pref-chip__input"
                />
                <Icon size={14} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Scores */}
        {comfortData && hasRoute && (
          <div className="scores-row" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="score-card">
              <div className={`score-circle score-circle--${comfortLevel}`}>
                {comfortData.comfort}%
              </div>
              <div className="score-card__label">Comfort</div>
            </div>
            <div className="score-card">
              <div className={`score-circle score-circle--${jistotaLevel}`}>
                <Shield size={13} />
                {comfortData.jistota}%
              </div>
              <div className="score-card__label">Jistota</div>
            </div>
            {selected && (
              <>
                <div className="score-card">
                  <div className="score-value">
                    {(selected.distance / 1000).toFixed(1)} km
                  </div>
                  <div className="score-card__label">Distance</div>
                </div>
                <div className="score-card">
                  <div className="score-value">
                    {Math.round(selected.duration / 60)} min
                  </div>
                  <div className="score-card__label">Walking</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Factor breakdown */}
        {comfortData && Object.keys(comfortData.factors).length > 0 && (
          <div className="factors-grid" style={{ animation: 'fadeIn 0.4s ease' }}>
            {Object.entries(comfortData.factors).map(([key, count]) => (
              <div
                key={key}
                className={`factor-item ${count > 0 ? 'factor-item--good' : 'factor-item--none'}`}
              >
                <span className="factor-item__count">{count}</span>
                <span className="factor-item__label">{FACTOR_LABELS[key] || key}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
