import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import Onboarding from './components/onboarding/Onboarding';
import CityMap from './components/map/CityMap';
import RoutePanel from './components/map/RoutePanel';
import HelpNearbyPanel from './components/map/HelpNearbyPanel';
import translations from './data/i18n';
import { loadBackendData, loadFrontendData } from './data/pragueData';

const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 };

const MODE_DEFAULT_PREFS = {
  wheelchair: { benches: true, toilets: true, elevators: true },
  senior:     { benches: true, toilets: true, elevators: false },
  tourist:    { benches: false, toilets: true, elevators: false },
  standard:   { benches: true, toilets: true, elevators: false },
};

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// DATA_MAP will be populated dynamically from real GeoJSON data
let DATA_MAP = {
  benches: [],
  toilets: [],
  elevators: [],
  stairs: [],
  aed: [],
  clinics: [],
  disabledParking: [],
  drinkingWater: [],
};

let _dataLoaded = false;
let _dataPromise = null;

function ensureDataLoaded() {
  if (_dataPromise) return _dataPromise;
  _dataPromise = Promise.all([loadBackendData(), loadFrontendData()]).then(([backend, frontend]) => {
    DATA_MAP = {
      benches: backend.benches,
      toilets: backend.toilets,
      elevators: backend.elevators,
      stairs: backend.stairs,
      aed: frontend.aed,
      clinics: frontend.clinics,
      disabledParking: frontend.disabledParking,
      drinkingWater: frontend.drinkingWater,
    };
    _dataLoaded = true;
    return DATA_MAP;
  });
  return _dataPromise;
}

function computeComfortAndJistota(routeCoords, preferences, routeInfo) {
  if (!routeCoords || routeCoords.length === 0) return { comfort: 0, jistota: 0, factors: {} };

  const stats = routeInfo?.routeStats || {};
  const nearbyPOI = routeInfo?.nearbyPOI || {};

  // Start high, penalize issues
  let score = 82;

  // Surface penalties
  const badSurfaces = (stats.surfaces || []).filter(s =>
    ['cobblestone', 'sett', 'gravel', 'unpaved', 'dirt'].includes(s)
  );
  score -= badSurfaces.length * 4;

  // Steps penalty
  if (stats.stepsCount > 0) {
    score -= Math.min(15, stats.stepsCount * 4);
  }

  // Incline penalty
  if (stats.maxInclinePercent && stats.maxInclinePercent > 5) {
    score -= Math.min(12, (stats.maxInclinePercent - 5) * 2);
  }

  // Unlit penalty
  const totalMeters = (stats.litMeters || 0) + (stats.unlitMeters || 0);
  if (totalMeters > 0 && stats.unlitMeters > 0) {
    score -= Math.min(8, (stats.unlitMeters / totalMeters) * 10);
  }

  // POI bonuses from backend
  if (nearbyPOI.benches && nearbyPOI.benches.length > 0) {
    score += Math.min(8, nearbyPOI.benches.length * 2);
  }
  if (nearbyPOI.toilets && nearbyPOI.toilets.length > 0) {
    score += 4;
  }
  if (nearbyPOI.wheelchairToilets && nearbyPOI.wheelchairToilets.length > 0) {
    score += 3;
  }

  // Also check frontend POI proximity
  const BUFFER = 300;
  const step = Math.max(1, Math.floor(routeCoords.length / 30));
  const samples = [];
  for (let i = 0; i < routeCoords.length; i += step) samples.push(routeCoords[i]);

  const factors = {};
  let poisNearRoute = 0;

  Object.keys(preferences).forEach((key) => {
    if (!preferences[key]) return;
    const data = DATA_MAP[key];
    if (!data) return;
    let count = 0;
    data.forEach((item) => {
      if (samples.some(([lng, lat]) => distanceMeters(lat, lng, item.lat, item.lng) <= BUFFER)) count++;
    });
    factors[key] = count;
    if (count > 0) poisNearRoute++;
  });

  score += poisNearRoute * 3;

  const comfort = Math.min(98, Math.max(20, Math.round(score)));

  // Jistota based on POI coverage + route quality
  const activePrefs = Object.keys(preferences).filter(k => preferences[k]).length;
  const ratio = activePrefs > 0 ? poisNearRoute / activePrefs : 0.5;
  const jistota = Math.min(95, Math.max(35, Math.round(55 + ratio * 25 + Math.min(15, routeCoords.length / 20))));

  return { comfort, jistota, factors };
}

// ── Route via datahacka Dijkstra backend ────────────────────────────

const ROUTING_API = `http://${window.location.hostname}:3001`;

// Map frontend mode names to backend profile names
const MODE_TO_PROFILE = {
  wheelchair: 'wheelchair',
  senior: 'senior',
  tourist: 'default',
  standard: 'default',
};

async function computeComfortRoute(start, end, preferences, activeMode) {
  const profile = MODE_TO_PROFILE[activeMode] || 'default';

  const res = await fetch(`${ROUTING_API}/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: { lat: start.lat, lon: start.lng },
      to: { lat: end.lat, lon: end.lng },
      profile,
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  if (!data.geometry || !data.geometry.coordinates) return [];

  const route = {
    coordinates: data.geometry.coordinates,
    distance: data.distanceMeters,
    duration: (data.distanceMeters / 1.2), // ~walking speed 1.2 m/s estimate
    explanation: data.explanation || [],
    routeStats: data.routeStats || {},
    nearbyPOI: data.nearbyPOI || {},
  };

  return [route];
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
      const a = data.address;
      const road = a.road || a.pedestrian || a.path || a.cycleway || a.footway || a.bridge || a.construction || '';
      const num = a.house_number || '';
      const sub = a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
      const place = a.amenity || a.building || a.leisure || a.tourism || '';
      // Best: street + number
      if (road && num) return `${road} ${num}${sub ? ', ' + sub : ''}`;
      if (road) return sub ? `${road}, ${sub}` : road;
      // Named place (park, building, etc.)
      if (place) return sub ? `${place}, ${sub}` : place;
      // At least suburb/district
      if (sub) return sub;
    }
    // Fallback: take first 3 meaningful parts from display_name, skip city-level
    if (data.display_name) {
      const parts = data.display_name.split(',').map(s => s.trim());
      const meaningful = parts.filter(p => !/(Praha|Prague|Česko|Czech|Hlavní město)/i.test(p));
      if (meaningful.length >= 2) return meaningful.slice(0, 2).join(', ');
      if (meaningful.length === 1) return meaningful[0];
      return parts.slice(0, 2).join(', ');
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

const ONBOARD_VERSION = '2';

export default function App() {
  // Onboarding / user prefs (persisted in localStorage)
  const [onboarded, setOnboarded] = useState(() => {
    try { return localStorage.getItem('knowb_onboarded') === ONBOARD_VERSION; } catch { return false; }
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
  const [preferences, setPreferences] = useState(MODE_DEFAULT_PREFS.wheelchair);
  const [routeData, setRouteData] = useState([]);
  const [bestRouteIndex, setBestRouteIndex] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [comfortData, setComfortData] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const watchIdRef = React.useRef(null);
  const forceProfileRef = React.useRef(null);
  const [pragueData, setPragueData] = useState(null);

  // Load real GeoJSON data
  useEffect(() => {
    if (!onboarded) return;
    ensureDataLoaded().then((data) => setPragueData(data)).catch(() => {});
  }, [onboarded]);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    setPreferences(MODE_DEFAULT_PREFS[activeMode] || MODE_DEFAULT_PREFS.standard);
  }, [activeMode]);

  // Get user geolocation
  useEffect(() => {
    if (!onboarded) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPosition(loc);
        },
        () => {
          setGpsError(t.gps_error);
          setTimeout(() => setGpsError(null), 5000);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [onboarded]);

  // Auto-set route start from geolocation
  useEffect(() => {
    if (!userPosition || route.start) return;
    (async () => {
      const street = await reverseGeocode(userPosition.lat, userPosition.lng, lang);
      const address = `${street} (${t.my_location})`;
      setRoute(prev => {
        if (prev.start) return prev;
        return { ...prev, start: { ...userPosition, address } };
      });
      setSettingPoint('end');
    })();
  }, [userPosition, route.start, t.my_location, lang]);

  useEffect(() => {
    if (!route.start || !route.end) { setRouteData([]); setComfortData(null); return; }
    let cancelled = false;
    const profile = forceProfileRef.current || activeMode;
    forceProfileRef.current = null;
    (async () => {
      setIsLoadingRoute(true);
      try {
        const routes = await computeComfortRoute(route.start, route.end, preferences, profile);
        if (cancelled) return;
        if (routes.length > 0) {
          setRouteData(routes);
          setBestRouteIndex(0);
        } else { setRouteData([]); }
      } catch { if (!cancelled) setRouteData([]); }
      finally { if (!cancelled) setIsLoadingRoute(false); }
    })();
    return () => { cancelled = true; };
  }, [route.start, route.end, preferences, activeMode]);

  useEffect(() => {
    if (routeData.length === 0) { setComfortData(null); return; }
    // Pick the most comfortable route
    if (routeData.length > 1) {
      const comforts = routeData.map(r => computeComfortAndJistota(r.coordinates, preferences, r));
      const bestIdx = comforts.reduce((max, c, i) => c.comfort > comforts[max].comfort ? i : max, 0);
      setBestRouteIndex(bestIdx);
      setComfortData(comforts[bestIdx]);
    } else {
      setBestRouteIndex(0);
      setComfortData(computeComfortAndJistota(routeData[0].coordinates, preferences, routeData[0]));
    }
  }, [routeData, preferences]);

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
      localStorage.setItem('knowb_onboarded', ONBOARD_VERSION);
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

  const handleClearRoute = useCallback(async () => {
    setRouteData([]);
    setComfortData(null);
    setBestRouteIndex(0);
    setNavigating(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (userPosition) {
      const street = await reverseGeocode(userPosition.lat, userPosition.lng, lang);
      const address = `${street} (${t.my_location})`;
      setRoute({ start: { ...userPosition, address }, end: null });
      setSettingPoint('end');
    } else {
      setRoute({ start: null, end: null });
      setSettingPoint('start');
    }
  }, [userPosition, t.my_location, lang]);

  const handleStartNav = useCallback(() => {
    setNavigating(true);
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
  }, []);

  const handleStopNav = useCallback(() => {
    setNavigating(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
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

  const handleSetStart = useCallback((location) => {
    setRoute(prev => ({ ...prev, start: location }));
    setSettingPoint('end');
  }, []);

  const handleSetEnd = useCallback((location) => {
    setRoute(prev => ({ ...prev, end: location }));
    setSettingPoint(null);
  }, []);

  const handleUseMyLocation = useCallback(async () => {
    const setFromGps = async (loc) => {
      setUserPosition(loc);
      setRoute(prev => ({ ...prev, start: { ...loc, address: t.my_location } }));
      setSettingPoint('end');
      const street = await reverseGeocode(loc.lat, loc.lng, lang);
      const address = `${street} (${t.my_location})`;
      setRoute(prev => {
        if (!prev.start) return prev;
        return { ...prev, start: { ...prev.start, address } };
      });
    };

    // Always re-request fresh GPS position
    if (navigator.geolocation) {
      // If we already have a position, use it instantly then refresh
      if (userPosition) {
        setRoute(prev => ({ ...prev, start: { ...userPosition, address: t.my_location } }));
        setSettingPoint('end');
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => setFromGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // GPS failed — if we had old position, still use it
          if (userPosition) {
            setFromGps(userPosition);
          } else {
            setGpsError(t.gps_error);
            setTimeout(() => setGpsError(null), 5000);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else if (userPosition) {
      setFromGps(userPosition);
    }
  }, [userPosition, t.my_location, lang, t.gps_error]);

  const handleEmergencyRoute = useCallback(async (destination) => {
    if (!destination) return;
    let startLoc;
    if (userPosition) {
      const street = await reverseGeocode(userPosition.lat, userPosition.lng, lang);
      startLoc = { ...userPosition, address: `${street} (${t.my_location})` };
    } else {
      startLoc = route.start;
    }
    if (!startLoc) return;
    const destName = destination.name
      || destination.props?.note
      || destination.props?.['defibrillator:location']
      || '';
    let address = destName;
    if (!address) {
      address = await reverseGeocode(destination.lat, destination.lng, lang);
    }
    forceProfileRef.current = 'standard';
    setRoute({
      start: startLoc,
      end: { lat: destination.lat, lng: destination.lng, address },
    });
    setSettingPoint(null);
    setShowHelp(false);
  }, [userPosition, route.start, t.my_location, lang]);

  const handleSetSettingPoint = useCallback((point) => {
    setSettingPoint(point);
  }, []);

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardComplete} />;
  }

  return (
    <div className="app-map">
      <header className="float-header">
        <div className="float-header__brand">
          <img
            src="/mobile-logo.png"
            alt="KnowB"
            className="float-header__logo-img float-header__logo-img--mobile"
          />
          <img
            src="/pc-logo.png"
            alt="KnowB"
            className="float-header__logo-img float-header__logo-img--pc"
          />
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
        bestRouteIndex={bestRouteIndex}
        onMapClick={handleMapClick}
        settingPoint={settingPoint}
        showHeatmap={false}
        showHelp={showHelp}
        showPOIs={showPOIs}
        isLoadingRoute={isLoadingRoute}
        t={t}
        userPosition={userPosition}
        navigating={navigating}
        pragueData={pragueData}
        onLocateMe={handleUseMyLocation}
        setUserPosition={setUserPosition}
        setGpsError={setGpsError}
      />

      {gpsError && (
        <div className="gps-toast" onClick={() => setGpsError(null)}>
          {gpsError}
        </div>
      )}

      {showHelp && (
        <HelpNearbyPanel
          userPosition={userPosition}
          pragueData={pragueData}
          t={t}
          onEmergencyRoute={handleEmergencyRoute}
        />
      )}

      <RoutePanel
        route={route}
        onClear={handleClearRoute}
        routeData={routeData}
        bestRouteIndex={bestRouteIndex}
        isLoadingRoute={isLoadingRoute}
        comfortData={comfortData}
        navigating={navigating}
        onStartNav={handleStartNav}
        onStopNav={handleStopNav}
        t={t}
        onSetStart={handleSetStart}
        onSetEnd={handleSetEnd}
        onUseMyLocation={handleUseMyLocation}
        userPosition={userPosition}
        onSetSettingPoint={handleSetSettingPoint}
      />
    </div>
  );
}
