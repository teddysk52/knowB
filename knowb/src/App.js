import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Sun, Moon, ShieldAlert, Eye, EyeOff } from 'lucide-react';
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

// ── Dijkstra comfort-aware routing ──────────────────────────────────
// Collects comfort POIs (benches, toilets, fountains, etc.) within a corridor
// between start and end, builds a weighted graph, and finds the path through
// waypoints that maximizes comfort. Then fetches an OSRM walking route
// through those waypoints.

function getComfortPOIs(start, end, preferences) {
  // Corridor width in meters around the straight line from start to end
  const CORRIDOR = 500;
  const allPOIs = [];

  // Comfort-relevant keys
  const COMFORT_KEYS = ['benches', 'toilets', 'fountains', 'elevators', 'pharmacies', 'aed', 'transport'];
  // Weight: how much each type contributes to comfort for a senior
  const COMFORT_WEIGHT = {
    benches: 3,
    toilets: 3,
    fountains: 2,
    elevators: 1,
    pharmacies: 1,
    aed: 1,
    transport: 1,
  };

  COMFORT_KEYS.forEach((key) => {
    if (!DATA_MAP[key]) return;
    const weight = (preferences[key] ? COMFORT_WEIGHT[key] || 1 : 0.2);
    DATA_MAP[key].forEach((item) => {
      const dToStart = distanceMeters(start.lat, start.lng, item.lat, item.lng);
      const dToEnd = distanceMeters(end.lat, end.lng, item.lat, item.lng);
      const directDist = distanceMeters(start.lat, start.lng, end.lat, end.lng);
      // Simple corridor check: POI must be within reasonable range
      if (dToStart + dToEnd <= directDist * 1.6 + CORRIDOR) {
        allPOIs.push({ ...item, comfortWeight: weight, category: key });
      }
    });
  });

  return allPOIs;
}

function dijkstraComfortRoute(start, end, pois) {
  // Nodes: 0 = start, 1..n = pois, n+1 = end
  const nodes = [
    { lat: start.lat, lng: start.lng, comfortWeight: 0 },
    ...pois,
    { lat: end.lat, lng: end.lng, comfortWeight: 0 },
  ];
  const n = nodes.length;
  const END_IDX = n - 1;

  // Build adjacency: each node connects to nodes within MAX_EDGE_DIST
  const MAX_EDGE_DIST = 800; // meters
  const adj = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distanceMeters(nodes[i].lat, nodes[i].lng, nodes[j].lat, nodes[j].lng);
      if (d <= MAX_EDGE_DIST || i === 0 || j === END_IDX) {
        // Edge cost = distance - comfort bonus of destination
        // Lower cost = better (shorter distance or more comfort)
        const comfortBonus = nodes[j].comfortWeight * 80;
        const cost = Math.max(1, d - comfortBonus);
        adj[i].push({ to: j, cost });

        const comfortBonusRev = nodes[i].comfortWeight * 80;
        const costRev = Math.max(1, d - comfortBonusRev);
        adj[j].push({ to: i, cost: costRev });
      }
    }
  }

  // Dijkstra from start (0) to end (END_IDX)
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  dist[0] = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && dist[i] < minDist) {
        minDist = dist[i];
        u = i;
      }
    }
    if (u === -1 || u === END_IDX) break;
    visited[u] = true;

    for (const { to, cost } of adj[u]) {
      if (!visited[to] && dist[u] + cost < dist[to]) {
        dist[to] = dist[u] + cost;
        prev[to] = u;
      }
    }
  }

  // Reconstruct path
  const path = [];
  let cur = END_IDX;
  while (cur !== -1) {
    path.unshift(nodes[cur]);
    cur = prev[cur];
  }

  // If path doesn't start at start node, Dijkstra couldn't connect — return direct
  if (path.length < 2 || distanceMeters(path[0].lat, path[0].lng, start.lat, start.lng) > 1) {
    return [{ lat: start.lat, lng: start.lng }, { lat: end.lat, lng: end.lng }];
  }

  return path;
}

async function fetchOSRMRoute(waypoints) {
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes && data.routes.length > 0) {
    return {
      coordinates: data.routes[0].geometry.coordinates,
      duration: data.routes[0].duration,
      distance: data.routes[0].distance,
    };
  }
  return null;
}

async function computeComfortRoute(start, end, preferences) {
  // 1. Get comfort POIs in corridor
  const pois = getComfortPOIs(start, end, preferences);

  // 2. Run Dijkstra to find optimal waypoints through comfort POIs
  const optimalPath = dijkstraComfortRoute(start, end, pois);

  // 3. Limit waypoints for OSRM (max ~8 intermediate points to avoid URL limits)
  let waypoints = optimalPath;
  if (waypoints.length > 10) {
    const step = Math.ceil(waypoints.length / 8);
    const sampled = [waypoints[0]];
    for (let i = step; i < waypoints.length - 1; i += step) {
      sampled.push(waypoints[i]);
    }
    sampled.push(waypoints[waypoints.length - 1]);
    waypoints = sampled;
  }

  // 4. Fetch OSRM route through comfort waypoints
  const comfortRoute = await fetchOSRMRoute(waypoints);

  // 5. Also fetch direct route for comparison
  const directRoute = await fetchOSRMRoute([
    { lat: start.lat, lng: start.lng },
    { lat: end.lat, lng: end.lng },
  ]);

  const routes = [];
  if (comfortRoute) routes.push(comfortRoute);
  if (directRoute && routes.length === 0) routes.push(directRoute);
  // If comfort route is the same as direct, just return one
  if (routes.length === 2 && comfortRoute.distance === directRoute.distance) {
    routes.pop();
  }

  return routes;
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
  const [mapCenter] = useState(PRAGUE_CENTER);
  const [preferences, setPreferences] = useState(MODE_DEFAULT_PREFS.wheelchair);
  const [routeData, setRouteData] = useState([]);
  const [bestRouteIndex, setBestRouteIndex] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [comfortData, setComfortData] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const watchIdRef = React.useRef(null);

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
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [onboarded]);

  // Auto-set route start from geolocation
  useEffect(() => {
    if (!userPosition || route.start) return;
    (async () => {
      const address = await reverseGeocode(userPosition.lat, userPosition.lng, lang);
      setRoute(prev => {
        if (prev.start) return prev;
        return { ...prev, start: { ...userPosition, address } };
      });
      setSettingPoint('end');
    })();
  }, [userPosition, lang, route.start]);

  useEffect(() => {
    if (!route.start || !route.end) { setRouteData([]); setComfortData(null); return; }
    let cancelled = false;
    (async () => {
      setIsLoadingRoute(true);
      try {
        // Use Dijkstra comfort-aware routing
        const routes = await computeComfortRoute(route.start, route.end, preferences);
        if (cancelled) return;
        if (routes.length > 0) {
          setRouteData(routes);
          setBestRouteIndex(0);
        } else { setRouteData([]); }
      } catch { if (!cancelled) setRouteData([]); }
      finally { if (!cancelled) setIsLoadingRoute(false); }
    })();
    return () => { cancelled = true; };
  }, [route.start, route.end, preferences]);

  useEffect(() => {
    if (routeData.length === 0) { setComfortData(null); return; }
    // Pick the most comfortable route
    if (routeData.length > 1) {
      const comforts = routeData.map(r => computeComfortAndJistota(r.coordinates, preferences));
      const bestIdx = comforts.reduce((max, c, i) => c.comfort > comforts[max].comfort ? i : max, 0);
      setBestRouteIndex(bestIdx);
      setComfortData(comforts[bestIdx]);
    } else {
      setBestRouteIndex(0);
      setComfortData(computeComfortAndJistota(routeData[0].coordinates, preferences));
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

  const handleClearRoute = useCallback(() => {
    setRouteData([]);
    setComfortData(null);
    setBestRouteIndex(0);
    setNavigating(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (userPosition) {
      reverseGeocode(userPosition.lat, userPosition.lng, lang).then(address => {
        setRoute({ start: { ...userPosition, address }, end: null });
      });
      setSettingPoint('end');
    } else {
      setRoute({ start: null, end: null });
      setSettingPoint('start');
    }
  }, [userPosition, lang]);

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
      />

      {showHelp && <HelpNearbyPanel mapCenter={mapCenter} t={t} />}

      <RoutePanel
        route={route}
        settingPoint={settingPoint}
        onClear={handleClearRoute}
        routeData={routeData}
        bestRouteIndex={bestRouteIndex}
        isLoadingRoute={isLoadingRoute}
        comfortData={comfortData}
        preferences={preferences}
        onTogglePref={handleTogglePref}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
        navigating={navigating}
        onStartNav={handleStartNav}
        onStopNav={handleStopNav}
        t={t}
      />
    </div>
  );
}
