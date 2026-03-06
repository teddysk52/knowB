import React, { useMemo, useCallback, useState } from 'react';
import MapGL, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MODES, LAYER_CONFIG } from '../../data/modes';
import * as mockData from '../../data/mockData';
import {
  Armchair, Bath, ArrowUpDown, HeartPulse,
  Cross, TrainFront, Droplets, Hospital,
  Navigation as NavIcon, MapPin, Loader2, Clock, Route,
} from 'lucide-react';

const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

const ICON_COMP = {
  Armchair, Bath, ArrowUpDown, HeartPulse,
  Cross, TrainFront, Droplets, Hospital,
};

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

function scoreToColor(score) {
  if (score >= 70) return '#059669';
  if (score >= 50) return '#f59e0b';
  return '#dc2626';
}

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function CityMap({
  theme, activeMode, route, routeData, selectedRouteIndex, onRouteSelect,
  onMapClick, settingPoint, showHeatmap, showHelp, showPOIs, isLoadingRoute,
}) {
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 14.4378,
    latitude: 50.0755,
    zoom: 14,
  });

  const modeConfig = MODES[activeMode];
  const activeLayers = modeConfig.layers;
  const highlightLayers = modeConfig.highlight;

  const markers = useMemo(() => {
    if (!showPOIs) return [];
    const result = [];
    activeLayers.forEach((layerKey) => {
      const data = DATA_MAP[layerKey];
      const config = LAYER_CONFIG[layerKey];
      if (!data || !config) return;
      const isHighlight = highlightLayers.includes(layerKey);
      data.forEach((item) => {
        result.push({
          ...item, layerKey, iconName: config.lucideIcon,
          color: config.color, label: config.label, isHighlight,
        });
      });
    });
    return result;
  }, [activeLayers, highlightLayers, showPOIs]);

  const helpMarkers = useMemo(() => {
    if (!showHelp) return [];
    const helpLayers = ['aed', 'pharmacies', 'hospitals'];
    const result = [];
    helpLayers.forEach((layerKey) => {
      const data = DATA_MAP[layerKey];
      const config = LAYER_CONFIG[layerKey];
      if (!data || !config) return;
      if (activeLayers.includes(layerKey)) return;
      data.forEach((item) => {
        result.push({
          ...item, layerKey, iconName: config.lucideIcon,
          color: config.color, label: config.label, isHighlight: true,
        });
      });
    });
    return result;
  }, [showHelp, activeLayers]);

  const handleClick = useCallback(
    (e) => {
      if (onMapClick && settingPoint) {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    },
    [onMapClick, settingPoint]
  );

  const heatmapGeoJson = useMemo(() => {
    if (!showHeatmap) return null;
    return {
      type: 'FeatureCollection',
      features: mockData.heatmapZones.map((z) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [z.lng, z.lat] },
        properties: { radius: z.radius, score: z.score, color: scoreToColor(z.score) },
      })),
    };
  }, [showHeatmap]);

  const sortedRoutes = useMemo(() => {
    if (!routeData || routeData.length === 0) return [];
    return routeData
      .map((r, i) => ({ ...r, index: i }))
      .sort((a, b) => {
        if (a.index === selectedRouteIndex) return 1;
        if (b.index === selectedRouteIndex) return -1;
        return 0;
      });
  }, [routeData, selectedRouteIndex]);

  const allMarkers = [...markers, ...helpMarkers];
  const cursorStyle = settingPoint ? 'crosshair' : 'grab';

  return (
    <div className="map-container">
      <MapGL
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES[theme]}
        onClick={handleClick}
        cursor={cursorStyle}
        attributionControl={true}
      >
        <NavigationControl position="top-left" />

        {heatmapGeoJson && (
          <Source id="heatmap-zones" type="geojson" data={heatmapGeoJson}>
            <Layer
              id="heatmap-circles"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate', ['exponential', 2], ['zoom'],
                  10, ['*', ['get', 'radius'], 0.012],
                  14, ['*', ['get', 'radius'], 0.16],
                  18, ['*', ['get', 'radius'], 2.5],
                ],
                'circle-color': ['get', 'color'],
                'circle-opacity': 0.15,
                'circle-stroke-width': 1.5,
                'circle-stroke-color': ['get', 'color'],
                'circle-stroke-opacity': 0.35,
              }}
            />
          </Source>
        )}

        {sortedRoutes.map(({ coordinates, index }) => {
          const isSelected = index === selectedRouteIndex;
          const geojson = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates },
          };
          return (
            <Source key={`route-${index}`} id={`route-${index}`} type="geojson" data={geojson}>
              {isSelected && (
                <Layer
                  id={`route-glow-${index}`}
                  type="line"
                  paint={{
                    'line-color': '#6366f1',
                    'line-width': 14,
                    'line-opacity': 0.12,
                    'line-blur': 10,
                  }}
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                />
              )}
              <Layer
                id={`route-line-${index}`}
                type="line"
                paint={{
                  'line-color': isSelected ? '#6366f1' : '#94a3b8',
                  'line-width': isSelected ? 5 : 4,
                  'line-opacity': isSelected ? 1 : 0.5,
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </Source>
          );
        })}

        {allMarkers.map((item) => (
          <Marker
            key={`${item.layerKey}-${item.id}`}
            longitude={item.lng}
            latitude={item.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo(item);
            }}
          >
            <div
              className={`poi-dot ${item.isHighlight ? 'poi-dot--highlight' : ''}`}
              style={{ '--dot-color': item.color }}
            />
          </Marker>
        ))}

        {route.start && (
          <Marker longitude={route.start.lng} latitude={route.start.lat} anchor="center">
            <div className="route-marker route-marker--start">
              <NavIcon size={16} />
            </div>
          </Marker>
        )}

        {route.end && (
          <Marker longitude={route.end.lng} latitude={route.end.lat} anchor="center">
            <div className="route-marker route-marker--end">
              <MapPin size={16} />
            </div>
          </Marker>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            offset={14}
          >
            <div className="popup-name">{popupInfo.name}</div>
            <div className="popup-type">{popupInfo.label}</div>
          </Popup>
        )}
      </MapGL>

      {routeData.length > 0 && (
        <div className="route-alternatives">
          {routeData.map((r, i) => (
            <button
              key={i}
              className={`route-alt-btn ${i === selectedRouteIndex ? 'route-alt-btn--active' : ''}`}
              onClick={() => onRouteSelect(i)}
            >
              <div className="route-alt-btn__info">
                <Clock size={14} />
                <span className="route-alt-btn__time">{formatDuration(r.duration)}</span>
                <Route size={12} />
                <span className="route-alt-btn__dist">{formatDistance(r.distance)}</span>
              </div>
              {i === 0 && <span className="route-alt-btn__badge">Fastest</span>}
            </button>
          ))}
        </div>
      )}

      {settingPoint && (
        <div className="map-cursor-hint">
          Click map: {settingPoint === 'start' ? 'Start point' : 'Destination'}
        </div>
      )}

      {isLoadingRoute && (
        <div className="map-loading">
          <Loader2 size={18} className="spin" />
        </div>
      )}
    </div>
  );
}
