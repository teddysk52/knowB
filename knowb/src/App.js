import React, { useState, useCallback } from 'react';
import { Accessibility, ShieldAlert, Layers, Activity } from 'lucide-react';
import ModeSwitcher from './components/modes/ModeSwitcher';
import CityMap from './components/map/CityMap';
import RoutePanel from './components/map/RoutePanel';
import NearbyPanel from './components/map/NearbyPanel';
import HelpNearbyPanel from './components/map/HelpNearbyPanel';
import AnalyticsSection from './components/analytics/AnalyticsSection';
import DataSourcesSection from './components/analytics/DataSourcesSection';

const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 };

export default function App() {
  const [activeMode, setActiveMode] = useState('wheelchair');
  const [route, setRoute] = useState({ start: null, end: null });
  const [settingPoint, setSettingPoint] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
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
    if (!settingPoint) setSettingPoint('start');
  }, [settingPoint]);

  const handleClearRoute = useCallback(() => {
    setRoute({ start: null, end: null });
    setSettingPoint(null);
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo-icon">
            <Accessibility size={18} />
          </div>
          <div>
            <h1 className="header__title">KnowB</h1>
          </div>
        </div>
        <p className="header__subtitle">Prague without barriers</p>
        <div className="header__status">
          <div className="header__status-dot" />
          Live data
        </div>
      </header>

      {/* Modes */}
      <ModeSwitcher activeMode={activeMode} onModeChange={handleModeChange} />

      {/* Map */}
      <section className="map-section">
        <CityMap
          activeMode={activeMode}
          route={route}
          onMapClick={handleMapClick}
          showHeatmap={showHeatmap}
          showHelp={showHelp}
        />

        {/* Map overlay controls */}
        <div className="map-controls">
          <button
            className={`map-control-btn ${showHelp ? 'map-control-btn--active' : 'map-control-btn--danger'}`}
            onClick={() => setShowHelp((v) => !v)}
            aria-label="Find help nearby"
            aria-pressed={showHelp}
          >
            <ShieldAlert size={16} />
            Find Help
          </button>
          <button
            className={`map-control-btn ${showHeatmap ? 'map-control-btn--active' : ''}`}
            onClick={() => setShowHeatmap((v) => !v)}
            aria-label="Toggle accessibility heatmap"
            aria-pressed={showHeatmap}
          >
            <Layers size={16} />
            Heatmap
          </button>
        </div>

        {/* Nearby panel */}
        <NearbyPanel activeMode={activeMode} mapCenter={mapCenter} />

        {/* Help nearby panel */}
        {showHelp && <HelpNearbyPanel mapCenter={mapCenter} />}

        {/* Heatmap legend */}
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

      {/* Route */}
      <RoutePanel
        route={route}
        settingPoint={settingPoint}
        onStartClick={handleSetRoute}
        onClear={handleClearRoute}
      />

      {/* Analytics */}
      <AnalyticsSection />

      {/* Data Sources */}
      <DataSourcesSection />

      {/* Footer */}
      <footer className="footer">
        <div className="footer__left">
          <Activity size={14} />
          KnowB — Prague without barriers
        </div>
        <div className="footer__right">
          Built with open city data &middot; 2026
        </div>
      </footer>
    </div>
  );
}
