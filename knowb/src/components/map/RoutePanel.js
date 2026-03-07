import React, { useState, useCallback, useEffect } from 'react';
import {
  Navigation, MapPin, X, Crosshair,
  Play, Square, RotateCcw,
} from 'lucide-react';

export default function RoutePanel({
  route, onClear,
  routeData, bestRouteIndex,
  isLoadingRoute, comfortData,
  navigating, onStartNav, onStopNav, t,
  onSetStart, onSetEnd, onUseMyLocation, userPosition,
  onSetSettingPoint,
}) {
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const hasRoute = routeData && routeData.length > 0;
  const selected = hasRoute ? routeData[bestRouteIndex] : null;
  const startAddr = route.start ? route.start.address : '';
  const endAddr = route.end ? route.end.address : '';

  useEffect(() => { if (startAddr) setStartInput(startAddr); }, [startAddr]);
  useEffect(() => { if (endAddr) setEndInput(endAddr); }, [endAddr]);

  const cLevel = comfortData
    ? comfortData.comfort >= 70 ? 'high' : comfortData.comfort >= 50 ? 'med' : 'low'
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

  // Navigation mode — clean minimal bar
  if (navigating && hasRoute && selected) {
    return (
      <div className="bbar bbar--nav">
        <div className="bbar__nav-top">
          <span className={`bbar__comfort bbar__comfort--${cLevel}`}>
            {comfortData ? comfortData.comfort : '—'}%
          </span>
          <span className="bbar__dot">·</span>
          <span className="bbar__km">{(selected.distance / 1000).toFixed(1)} km</span>
        </div>
        <div className="bbar__nav-dest">→ {endAddr}</div>
        <div className="bbar__nav-actions">
          <button className="bbar__stop" onClick={onStopNav}>
            <Square size={16} /> {t.stop_nav}
          </button>
          <button className="bbar__new" onClick={() => { onStopNav(); onClear(); setStartInput(''); setEndInput(''); }}>
            <RotateCcw size={16} /> {t.new_route}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bbar">
      <div className="bbar__inputs">
        <div className="bbar__row">
          <Navigation size={16} className="bbar__icon bbar__icon--start" />
          <input
            className="bbar__input"
            placeholder={t.from_placeholder}
            value={startInput}
            onChange={e => setStartInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') geocodeAndSet(startInput, 'start'); }}
            onFocus={() => onSetSettingPoint && onSetSettingPoint('start')}
          />
          {userPosition && (
            <button className="bbar__gps" onClick={onUseMyLocation} title={t.my_location}>
              <Crosshair size={16} />
            </button>
          )}
        </div>
        <div className="bbar__row">
          <MapPin size={16} className="bbar__icon bbar__icon--end" />
          <input
            className="bbar__input"
            placeholder={t.to_placeholder}
            value={endInput}
            onChange={e => setEndInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') geocodeAndSet(endInput, 'end'); }}
            onFocus={() => onSetSettingPoint && onSetSettingPoint('end')}
          />
        </div>
      </div>

      {hasRoute && (
        <div className="bbar__actions">
          <button className="bbar__clear" onClick={() => { onClear(); setStartInput(''); setEndInput(''); }}>
            <X size={16} /> {t.clear_route}
          </button>
          <button className="bbar__go" onClick={onStartNav}>
            <Play size={18} /> {t.start_nav}
          </button>
        </div>
      )}
    </div>
  );
}
