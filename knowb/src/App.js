import React, { useState, useCallback } from 'react';
import ModeSwitcher from './components/modes/ModeSwitcher';
import CityMap from './components/map/CityMap';
import RoutePanel from './components/map/RoutePanel';
import NearbyPanel from './components/map/NearbyPanel';
import SafePlacesPanel from './components/modes/SafePlacesPanel';

const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 };

export default function App() {
  const [activeMode, setActiveMode] = useState('wheelchair');
  const [route, setRoute] = useState({ start: null, end: null });
  const [settingPoint, setSettingPoint] = useState(null); // 'start' | 'end' | null
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [mapCenter] = useState(PRAGUE_CENTER);

  const handleModeChange = useCallback((mode) => {
    setActiveMode(mode);
  }, []);

  const handleMapClick = useCallback(
    (latlng) => {
      if (settingPoint === 'start') {
        setRoute((prev) => ({ ...prev, start: latlng }));
        setSettingPoint('end');
      } else if (settingPoint === 'end') {
        setRoute((prev) => ({ ...prev, end: latlng }));
        setSettingPoint(null);
      }
    },
    [settingPoint]
  );

  const handleSetRoute = useCallback(() => {
    if (!settingPoint) {
      setSettingPoint('start');
    }
  }, [settingPoint]);

  const handleClearRoute = useCallback(() => {
    setRoute({ start: null, end: null });
    setSettingPoint(null);
  }, []);

  const handleToggleSafePlace = useCallback((place) => {
    setSavedPlaces((prev) => {
      const exists = prev.find((p) => p.id === place.id);
      if (exists) return prev.filter((p) => p.id !== place.id);
      return [...prev, place];
    });
  }, []);

  const startText = route.start
    ? `${route.start.lat.toFixed(4)}, ${route.start.lng.toFixed(4)}`
    : '';
  const endText = route.end
    ? `${route.end.lat.toFixed(4)}, ${route.end.lng.toFixed(4)}`
    : '';

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="header__title">KnowB</h1>
        <p className="header__subtitle">Prague without barriers</p>
      </header>

      {/* Mode Switcher */}
      <ModeSwitcher activeMode={activeMode} onModeChange={handleModeChange} />

      {/* Map area with nearby panel and safe places */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CityMap
          activeMode={activeMode}
          route={route}
          onMapClick={handleMapClick}
          savedPlaces={savedPlaces}
        />

        <NearbyPanel activeMode={activeMode} mapCenter={mapCenter} />

        {activeMode === 'kidsafe' && (
          <SafePlacesPanel
            savedPlaces={savedPlaces}
            onTogglePlace={handleToggleSafePlace}
          />
        )}
      </div>

      {/* Route Panel */}
      <RoutePanel
        startText={startText}
        endText={endText}
        onStartChange={() => {}}
        onEndChange={() => {}}
        onStartClick={handleSetRoute}
        onClear={handleClearRoute}
        settingPoint={settingPoint}
      />
    </div>
  );
}
