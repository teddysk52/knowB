import React, { useState, useCallback, useEffect } from 'react';
import { Accessibility, Sun, Moon, ShieldAlert, Layers, Eye, EyeOff, Activity } from 'lucide-react';
import ModeSwitcher from './components/modes/ModeSwitcher';
import CityMap from './components/map/CityMap';
import RoutePanel from './components/map/RoutePanel';
import NearbyPanel from './components/map/NearbyPanel';
import HelpNearbyPanel from './components/map/HelpNearbyPanel';
import AnalyticsSection from './components/analytics/AnalyticsSection';
import DataSourcesSection from './components/analytics/DataSourcesSection';
import * as mockData from './data/mockData';

const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 };

const MODE_DEFAULT_PREFS = {
  wheelchair: { benches: true, toilets: true, elevators: true, aed: true, pharmacies: false, fountains: false, transport: true },
  senior:     { benches: true, toilets: true, elevators: false, aed: true, pharmacies: true, fountains: true, transport: false },
  tourist:    { benches: false, toilets: true, elevators: false, aed: false, pharmacies: false, fountains: true, transport: true },
  standard:   { benches: true, toilets: true, elevators: false, aed: false, pharmacies: false, fountains: false, transport: false },
};

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

function computeComfortAndJistota(routeCoords, preferences) {
  if (!routeCoords || routeCoords.length === 0) return { comfort: 0, jistota: 0, factors: {} };

  const BUFFER = 200;
  const step = Math.max(1, Math.floor(routeCoords.length / 40));
  const samples = [];
  for (let i = 0; i < routeCoords.length; i += step) samples.push(routeCoords[i]);

  const factors = {};
  let activePrefs = 0;
  let coveredPrefs = 0;

  Object.keys(preferences).forEach((key) => {
    if (!preferences[key]) return;
    activePrefs++;
    const data = DATA_MAP[key];
    if (!data) return;
    let count = 0;
    data.forEach((item) => {
      if (samples.some(([lng, lat]) => distanceMeters(lat, lng, item.lat, item.lng) <= BUFFER)) count++;
    });
    factors[key] = count;
    if (count > 0) coveredPrefs++;
  });

  let raw = 50;
  Object.values(factors).forEach((c) => {
    if (c >= 3) raw += 10;
    else if (c >= 2) raw += 7;
    else if (c >= 1) raw += 4;
    else raw -= 5;
  });
  const comfort = Math.min(100, Math.max(10, Math.round(raw)));

  const ratio = activePrefs > 0 ? coveredPrefs / activePrefs : 0.5;
  const density = Math.min(15, routeCoords.length / 10);
  const jistota = Math.min(95, Math.max(25, Math.round(40 + ratio * 35 + density)));

  return { comfort, jistota, factors };
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      { headers: { 'Accept-Language': 'cs,en' } }
    );
    const data = await res.json();
    if (data.address) {
      const road = data.address.road || data.address.pedestrian || data.address.path || '';
      const num = data.address.house_number || '';
      const sub = data.address.suburb || data.address.neighbourhood || data.address.quarter || '';
      if (road) return num ? `${road} ${num}` : road;
      if (sub) return sub;
    }
    if (data.display_name) return data.display_name.split(',').slice(0, 2).join(', ').trim();
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeMode, setActiveMode] = useState('wheelchair');
  const [route, setRoute] = useState({ start: null, end: null });
  const [settingPoint, setSettingPoint] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPOIs, setShowPOIs] = useState(true);
  const [mapCenter] = useState(PRAGUE_CENTER);
  const [preferences, setPreferences] = useState(MODE_DEFAULT_PREFS.wheelchair);
  const [routeData, setRouteData] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [comfortData, setComfortData] = useState(null);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  useEffect(() => {
    setPreferences(MODE_DEFAULT_PREFS[activeMode] || MODE_DEFAULT_PREFS.standard);
  }, [activeMode]);

  useEffect(() => {
    if (!route.start || !route.end) { setRouteData([]); setComfortData(null); return; }
    let cancelled = false;
    (async () => {
      setIsLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/foot/${route.start.lng},${route.start.lat};${route.end.lng},${route.end.lat}?overview=full&geometries=geojson&alternatives=true`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (data.routes && data.routes.length > 0) {
          setRouteData(data.routes.map((r) => ({
            coordinates: r.geometry.coordinates,
            duration: r.duration,
            distance: r.distance,
          })));
          setSelectedRouteIndex(0);
        } else { setRouteData([]); }
      } catch { if (!cancelled) setRouteData([]); }
      finally { if (!cancelled) setIsLoadingRoute(false); }
    })();
    return () => { cancelled = true; };
  }, [route.start, route.end]);

  useEffect(() => {
    if (routeData.length === 0 || !routeData[selectedRouteIndex]) { setComfortData(null); return; }
    setComfortData(computeComfortAndJistota(routeData[selectedRouteIndex].coordinates, preferences));
  }, [routeData, selectedRouteIndex, preferences]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const handleMapClick = useCallback(
    async (latlng) => {
      if (!settingPoint) return;
      const address = await reverseGeocode(latlng.lat, latlng.lng);
      if (settingPoint === 'start') {
        setRoute((prev) => ({ ...prev, start: { ...latlng, address } }));
        setSettingPoint('end');
      } else if (settingPoint === 'end') {
        setRoute((prev) => ({ ...prev, end: { ...latlng, address } }));
        setSettingPoint(null);
      }
    },
    [settingPoint]
  );

  const handleSetRoute = useCallback(() => setSettingPoint('start'), []);

  const handleClearRoute = useCallback(() => {
    setRoute({ start: null, end: null });
    setRouteData([]);
    setComfortData(null);
    setSettingPoint(null);
    setSelectedRouteIndex(0);
  }, []);

  const handleTogglePref = useCallback((key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header__brand">
          <div className="header__logo-icon">
            <Accessibility size={18} />
          </div>
          <h1 className="header__title">KnowB</h1>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <ModeSwitcher activeMode={activeMode} onModeChange={setActiveMode} />

      <section className="map-section">
        <CityMap
          theme={theme}
          activeMode={activeMode}
          route={route}
          routeData={routeData}
          selectedRouteIndex={selectedRouteIndex}
          onRouteSelect={setSelectedRouteIndex}
          onMapClick={handleMapClick}
          settingPoint={settingPoint}
          showHeatmap={showHeatmap}
          showHelp={showHelp}
          showPOIs={showPOIs}
          isLoadingRoute={isLoadingRoute}
        />
        <div className="map-controls">
          <button
            className={`map-control-btn ${showPOIs ? 'map-control-btn--active' : ''}`}
            onClick={() => setShowPOIs((v) => !v)}
          >
            {showPOIs ? <Eye size={16} /> : <EyeOff size={16} />}
            POIs
          </button>
          <button
            className={`map-control-btn ${showHelp ? 'map-control-btn--active' : 'map-control-btn--danger'}`}
            onClick={() => setShowHelp((v) => !v)}
          >
            <ShieldAlert size={16} />
            Help
          </button>
          <button
            className={`map-control-btn ${showHeatmap ? 'map-control-btn--active' : ''}`}
            onClick={() => setShowHeatmap((v) => !v)}
          >
            <Layers size={16} />
            Heatmap
          </button>
        </div>
        <NearbyPanel activeMode={activeMode} mapCenter={mapCenter} />
        {showHelp && <HelpNearbyPanel mapCenter={mapCenter} />}
        {showHeatmap && (
          <div className="heatmap-legend">
            <div className="heatmap-legend__item">
              <div className="heatmap-legend__dot" style={{ background: '#059669' }} />
              High
            </div>
            <div className="heatmap-legend__item">
              <div className="heatmap-legend__dot" style={{ background: '#f59e0b' }} />
              Medium
            </div>
            <div className="heatmap-legend__item">
              <div className="heatmap-legend__dot" style={{ background: '#dc2626' }} />
              Low
            </div>
          </div>
        )}
      </section>

      <RoutePanel
        route={route}
        settingPoint={settingPoint}
        onStartClick={handleSetRoute}
        onClear={handleClearRoute}
        routeData={routeData}
        selectedRouteIndex={selectedRouteIndex}
        onRouteSelect={setSelectedRouteIndex}
        isLoadingRoute={isLoadingRoute}
        comfortData={comfortData}
        preferences={preferences}
        onTogglePref={handleTogglePref}
      />

      <AnalyticsSection theme={theme} />
      <DataSourcesSection />

      <footer className="footer">
        <div className="footer__left">
          <Activity size={14} />
          KnowB — Accessible Prague
        </div>
        <div className="footer__right">Open city data &middot; 2026</div>
      </footer>
    </div>
  );
}
