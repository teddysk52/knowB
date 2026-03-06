import React, { useState, useCallback, useEffect } from 'react';
import { Accessibility, Sun, Moon, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import Onboarding from './components/onboarding/Onboarding';
import CityMap from './components/map/CityMap';
import RoutePanel from './components/map/RoutePanel';
import HelpNearbyPanel from './components/map/HelpNearbyPanel';
import translations from './data/i18n';
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

async function reverseGeocode(lat, lng, lang) {
  try {
    const acceptLang = lang === 'cs' ? 'cs,en' : 'en,cs';
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      { headers: { 'Accept-Language': acceptLang } }
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
  // Onboarding / user prefs (persisted in localStorage)
  const [onboarded, setOnboarded] = useState(() => {
    try { return localStorage.getItem('knowb_onboarded') === '1'; } catch { return false; }
  });
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('knowb_lang') || 'cs'; } catch { return 'cs'; }
  });
  const [fontSize, setFontSize] = useState(() => {
    try { return parseInt(localStorage.getItem('knowb_fontsize'), 10) || 17; } catch { return 17; }
  });

  const t = translations[lang] || translations.cs;

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('knowb_theme') || 'light'; } catch { return 'light'; }
  });
  const [activeMode, setActiveMode] = useState(() => {
    try { return localStorage.getItem('knowb_mode') || 'wheelchair'; } catch { return 'wheelchair'; }
  });
  const [route, setRoute] = useState({ start: null, end: null });
  const [settingPoint, setSettingPoint] = useState('start');
  const [showHelp, setShowHelp] = useState(false);
  const [showPOIs, setShowPOIs] = useState(true);
  const [mapCenter] = useState(PRAGUE_CENTER);
  const [preferences, setPreferences] = useState(MODE_DEFAULT_PREFS.wheelchair);
  const [routeData, setRouteData] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [comfortData, setComfortData] = useState(null);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

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

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('knowb_theme', next); } catch {}
      return next;
    });
  }, []);

  const handleOnboardComplete = useCallback(({ lang: l, userType, fontSize: fs }) => {
    setLang(l);
    setActiveMode(userType);
    setFontSize(fs);
    setOnboarded(true);
    try {
      localStorage.setItem('knowb_onboarded', '1');
      localStorage.setItem('knowb_lang', l);
      localStorage.setItem('knowb_mode', userType);
      localStorage.setItem('knowb_fontsize', String(fs));
    } catch {}
  }, []);

  const handleMapClick = useCallback(
    async (latlng) => {
      if (!settingPoint) {
        // First click starts route automatically
        const address = await reverseGeocode(latlng.lat, latlng.lng, lang);
        setRoute((prev) => ({ ...prev, start: { ...latlng, address } }));
        setSettingPoint('end');
        return;
      }
      const address = await reverseGeocode(latlng.lat, latlng.lng, lang);
      if (settingPoint === 'start') {
        setRoute((prev) => ({ ...prev, start: { ...latlng, address } }));
        setSettingPoint('end');
      } else if (settingPoint === 'end') {
        setRoute((prev) => ({ ...prev, end: { ...latlng, address } }));
        setSettingPoint(null);
      }
    },
    [settingPoint, lang]
  );

  const handleClearRoute = useCallback(() => {
    setRoute({ start: null, end: null });
    setRouteData([]);
    setComfortData(null);
    setSettingPoint('start');
    setSelectedRouteIndex(0);
  }, []);

  const handleTogglePref = useCallback((key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSelectAll = useCallback(() => {
    setPreferences((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { next[k] = true; });
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setPreferences((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { next[k] = false; });
      return next;
    });
  }, []);

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardComplete} />;
  }

  return (
    <div className="app-map">
      <header className="float-header">
        <div className="float-header__brand">
          <div className="float-header__logo">
            <Accessibility size={18} />
          </div>
          <span className="float-header__name">{t.app_name}</span>
        </div>
        <div className="float-header__right">
          <button
            className={`fab ${showPOIs ? 'fab--active' : ''}`}
            onClick={() => setShowPOIs((v) => !v)}
            aria-label={t.ctrl_pois}
          >
            {showPOIs ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            className={`fab ${showHelp ? 'fab--active' : 'fab--alert'}`}
            onClick={() => setShowHelp((v) => !v)}
            aria-label={t.ctrl_help}
          >
            <ShieldAlert size={18} />
          </button>
          <button className="fab" onClick={toggleTheme} aria-label="Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <CityMap
        theme={theme}
        activeMode={activeMode}
        route={route}
        routeData={routeData}
        selectedRouteIndex={selectedRouteIndex}
        onRouteSelect={setSelectedRouteIndex}
        onMapClick={handleMapClick}
        settingPoint={settingPoint}
        showHeatmap={false}
        showHelp={showHelp}
        showPOIs={showPOIs}
        isLoadingRoute={isLoadingRoute}
        t={t}
      />

      {showHelp && <HelpNearbyPanel mapCenter={mapCenter} t={t} />}

      <RoutePanel
        route={route}
        settingPoint={settingPoint}
        onClear={handleClearRoute}
        routeData={routeData}
        selectedRouteIndex={selectedRouteIndex}
        onRouteSelect={setSelectedRouteIndex}
        isLoadingRoute={isLoadingRoute}
        comfortData={comfortData}
        preferences={preferences}
        onTogglePref={handleTogglePref}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
        t={t}
      />
    </div>
  );
}
