import React, { useState } from 'react';
import {
  Navigation, MapPin, X, CheckCheck, XCircle,
  ChevronUp, ChevronDown,
  Armchair, Bath, ArrowUpDown, HeartPulse,
  Cross, TrainFront, Droplets,
} from 'lucide-react';

const PREFS = [
  { key: 'benches', Icon: Armchair, tKey: 'pref_benches' },
  { key: 'toilets', Icon: Bath, tKey: 'pref_toilets' },
  { key: 'elevators', Icon: ArrowUpDown, tKey: 'pref_elevators' },
  { key: 'aed', Icon: HeartPulse, tKey: 'pref_aed' },
  { key: 'pharmacies', Icon: Cross, tKey: 'pref_pharmacies' },
  { key: 'fountains', Icon: Droplets, tKey: 'pref_water' },
  { key: 'transport', Icon: TrainFront, tKey: 'pref_transit' },
];

export default function RoutePanel({
  route, settingPoint, onClear,
  routeData, selectedRouteIndex,
  isLoadingRoute, comfortData, preferences, onTogglePref, onSelectAll, onClearAll, t,
}) {
  const [open, setOpen] = useState(false);
  const hasRoute = routeData && routeData.length > 0;
  const selected = hasRoute ? routeData[selectedRouteIndex] : null;
  const startAddr = route.start ? route.start.address : '';
  const endAddr = route.end ? route.end.address : '';

  const allOn = PREFS.every(({ key }) => preferences[key]);
  const allOff = PREFS.every(({ key }) => !preferences[key]);

  const cLevel = comfortData
    ? comfortData.comfort >= 70 ? 'high' : comfortData.comfort >= 50 ? 'med' : 'low'
    : null;
  const jLevel = comfortData
    ? comfortData.jistota >= 70 ? 'high' : comfortData.jistota >= 50 ? 'med' : 'low'
    : null;

  // Status hint for the user
  const hint = settingPoint === 'start'
    ? t.tap_start
    : settingPoint === 'end'
    ? t.tap_dest
    : hasRoute
    ? null
    : t.sheet_hint;

  return (
    <div className={`sheet ${open ? 'sheet--open' : ''}`}>
      <button className="sheet__handle" onClick={() => setOpen(!open)} aria-label="Toggle">
        <span className="sheet__bar" />
      </button>

      {/* Peek state — always shows filters + hint */}
      {!open && (
        <div className="sheet__peek">
          {hasRoute && comfortData ? (
            <button className="sheet__row" onClick={() => setOpen(true)}>
              <span className={`sheet__badge sheet__badge--${cLevel}`}>
                {comfortData.comfort}%
              </span>
              <span className="sheet__info">
                {(selected.distance / 1000).toFixed(1)} km
              </span>
              <ChevronUp size={18} className="sheet__chevron" />
            </button>
          ) : (
            <div className="sheet__peek-filters">
              {hint && <div className="sheet__hint">{hint}</div>}
              <div className="sheet__prefs">
                {PREFS.map(({ key, Icon, tKey }) => (
                  <button
                    key={key}
                    className={`sheet__pref ${preferences[key] ? 'sheet__pref--on' : ''}`}
                    onClick={() => onTogglePref(key)}
                  >
                    <Icon size={15} />
                    <span>{t[tKey]}</span>
                  </button>
                ))}
              </div>
              <div className="sheet__bulk">
                <button className={`sheet__bulk-btn ${allOn ? 'sheet__bulk-btn--dim' : ''}`} onClick={onSelectAll}>
                  <CheckCheck size={15} /> {t.select_all}
                </button>
                <button className={`sheet__bulk-btn ${allOff ? 'sheet__bulk-btn--dim' : ''}`} onClick={onClearAll}>
                  <XCircle size={15} /> {t.clear_all}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expanded state */}
      {open && (
        <div className="sheet__body">
          {/* Addresses */}
          <div className="sheet__addrs">
            <div className="sheet__addr">
              <Navigation size={16} className="sheet__addr-icon sheet__addr-icon--start" />
              <span className="sheet__addr-text">{startAddr || t.point_a}</span>
            </div>
            <div className="sheet__addr">
              <MapPin size={16} className="sheet__addr-icon sheet__addr-icon--end" />
              <span className="sheet__addr-text">{endAddr || t.point_b}</span>
            </div>
          </div>

          {/* Clear button */}
          {(hasRoute || route.start) && (
            <button className="sheet__clear" onClick={onClear}>
              <X size={16} /> {t.clear_route}
            </button>
          )}

          {/* Filters always visible */}
          <div className="sheet__prefs">
            {PREFS.map(({ key, Icon, tKey }) => (
              <button
                key={key}
                className={`sheet__pref ${preferences[key] ? 'sheet__pref--on' : ''}`}
                onClick={() => onTogglePref(key)}
              >
                <Icon size={15} />
                <span>{t[tKey]}</span>
              </button>
            ))}
          </div>
          <div className="sheet__bulk">
            <button className={`sheet__bulk-btn ${allOn ? 'sheet__bulk-btn--dim' : ''}`} onClick={onSelectAll}>
              <CheckCheck size={15} /> {t.select_all}
            </button>
            <button className={`sheet__bulk-btn ${allOff ? 'sheet__bulk-btn--dim' : ''}`} onClick={onClearAll}>
              <XCircle size={15} /> {t.clear_all}
            </button>
          </div>

          {/* Scores */}
          {hasRoute && comfortData && (
            <>
              <div className="sheet__scores">
                <div className="sheet__sc">
                  <span className={`sheet__num sheet__num--${cLevel}`}>{comfortData.comfort}</span>
                  <span className="sheet__lbl">{t.comfort}</span>
                </div>
                <div className="sheet__sc">
                  <span className={`sheet__num sheet__num--${jLevel}`}>{comfortData.jistota}</span>
                  <span className="sheet__lbl">{t.jistota}</span>
                </div>
                <div className="sheet__sc">
                  <span className="sheet__num">{(selected.distance / 1000).toFixed(1)}</span>
                  <span className="sheet__lbl">km</span>
                </div>
              </div>

              {Object.keys(comfortData.factors).length > 0 && (
                <div className="sheet__facts">
                  {Object.entries(comfortData.factors).map(([key, count]) => {
                    const pref = PREFS.find((p) => p.key === key);
                    return (
                      <div key={key} className={`sheet__fact ${count > 0 ? 'sheet__fact--ok' : ''}`}>
                        <span className="sheet__fact-n">{count}×</span>
                        <span>{pref ? t[pref.tKey] : key}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <button className="sheet__collapse" onClick={() => setOpen(false)}>
            <ChevronDown size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
