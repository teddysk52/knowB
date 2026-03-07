import React, { useState, useCallback, useEffect } from 'react';
import {
  Navigation, MapPin, X, Crosshair,
  ChevronUp, ChevronDown, Play, Square,
} from 'lucide-react';

export default function RoutePanel({
  route, onClear,
  routeData, bestRouteIndex,
  isLoadingRoute, comfortData,
  navigating, onStartNav, onStopNav, t,
  onSetStart, onSetEnd, onUseMyLocation, userPosition,
}) {
  const [open, setOpen] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const hasRoute = routeData && routeData.length > 0;
  const selected = hasRoute ? routeData[bestRouteIndex] : null;
  const startAddr = route.start ? route.start.address : '';
  const endAddr = route.end ? route.end.address : '';

  // Sync inputs with externally-set addresses (map click, geolocation)
  useEffect(() => { if (startAddr) setStartInput(startAddr); }, [startAddr]);
  useEffect(() => { if (endAddr) setEndInput(endAddr); }, [endAddr]);

  const cLevel = comfortData
    ? comfortData.comfort >= 70 ? 'high' : comfortData.comfort >= 50 ? 'med' : 'low'
    : null;
  const jLevel = comfortData
    ? comfortData.jistota >= 70 ? 'high' : comfortData.jistota >= 50 ? 'med' : 'low'
    : null;

  const geocodeAndSet = useCallback(async (query, type) => {
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim() + ', Praha')}&format=json&limit=1&bounded=1&viewbox=14.22,49.94,14.71,50.18`,
        { headers: { 'Accept-Language': 'cs,en' } }
      );
      const results = await res.json();
      if (results.length > 0) {
        const loc = {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
          address: results[0].display_name.split(',').slice(0, 2).join(', ').trim(),
        };
        if (type === 'start') onSetStart(loc);
        else onSetEnd(loc);
      }
    } catch {}
  }, [onSetStart, onSetEnd]);

  // Navigation mode — minimal UI
  if (navigating && hasRoute && selected) {
    return (
      <div className="sheet sheet--nav">
        <div className="sheet__nav-bar">
          <div className="sheet__nav-info">
            <span className="sheet__nav-distance">{(selected.distance / 1000).toFixed(1)} km</span>
            <span className="sheet__nav-dest">{endAddr}</span>
          </div>
          <button className="sheet__nav-stop" onClick={onStopNav}>
            <Square size={16} /> {t.stop_nav}
          </button>
        </div>
      </div>
    );
  }

  const addressInputs = (
    <div className="sheet__address-inputs">
      <div className="sheet__input-row">
        <Navigation size={14} className="sheet__input-icon sheet__input-icon--start" />
        <input
          className="sheet__input"
          placeholder={t.from_placeholder}
          value={startInput}
          onChange={e => setStartInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') geocodeAndSet(startInput, 'start'); }}
        />
        {userPosition && (
          <button className="sheet__loc-btn" onClick={onUseMyLocation} title={t.my_location}>
            <Crosshair size={14} />
          </button>
        )}
      </div>
      <div className="sheet__input-row">
        <MapPin size={14} className="sheet__input-icon sheet__input-icon--end" />
        <input
          className="sheet__input"
          placeholder={t.to_placeholder}
          value={endInput}
          onChange={e => setEndInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') geocodeAndSet(endInput, 'end'); }}
        />
      </div>
    </div>
  );

  return (
    <div className={`sheet ${open ? 'sheet--open' : ''}`}>
      <button className="sheet__handle" onClick={() => setOpen(!open)} aria-label="Toggle">
        <span className="sheet__bar" />
      </button>

      {!open && (
        <div className="sheet__peek">
          {hasRoute && comfortData ? (
            <div className="sheet__peek-route">
              <button className="sheet__row" onClick={() => setOpen(true)}>
                <span className={`sheet__badge sheet__badge--${cLevel}`}>
                  {comfortData.comfort}%
                </span>
                <span className="sheet__info">
                  {(selected.distance / 1000).toFixed(1)} km
                </span>
                <ChevronUp size={18} className="sheet__chevron" />
              </button>
              <button className="sheet__go-btn" onClick={onStartNav}>
                <Play size={20} /> {t.start_nav}
              </button>
            </div>
          ) : (
            addressInputs
          )}
        </div>
      )}

      {open && (
        <div className="sheet__body">
          {addressInputs}

          {(hasRoute || route.start) && (
            <button className="sheet__clear" onClick={() => {
              onClear();
              setStartInput('');
              setEndInput('');
            }}>
              <X size={16} /> {t.clear_route}
            </button>
          )}

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

              <button className="sheet__go-btn sheet__go-btn--full" onClick={() => { onStartNav(); setOpen(false); }}>
                <Play size={20} /> {t.start_nav}
              </button>
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
