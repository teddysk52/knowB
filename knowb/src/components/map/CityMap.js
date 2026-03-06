import React, { useMemo, useCallback, useState } from 'react';
import MapGL, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MODES, LAYER_CONFIG } from '../../data/modes';
import * as mockData from '../../data/mockData';
import {
  Armchair, Bath, ArrowUpDown, HeartPulse,
  Cross, TrainFront, Droplets, Hospital,
  Flag, MapPin,
} from 'lucide-react';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

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

export default function CityMap({ activeMode, route, onMapClick, showHeatmap, showHelp }) {
  const [popupInfo, setPopupInfo] = useState(null);

  const modeConfig = MODES[activeMode];
  const activeLayers = modeConfig.layers;
  const highlightLayers = modeConfig.highlight;

  const markers = useMemo(() => {
    const result = [];
    activeLayers.forEach((layerKey) => {
      const data = DATA_MAP[layerKey];
      const config = LAYER_CONFIG[layerKey];
      if (!data || !config) return;
      const isHighlight = highlightLayers.includes(layerKey);
      data.forEach((item) => {
        result.push({
          ...item,
          layerKey,
          iconName: config.lucideIcon,
          color: config.color,
          label: config.label,
          isHighlight,
        });
      });
    });
    return result;
  }, [activeLayers, highlightLayers]);

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
          ...item,
          layerKey,
          iconName: config.lucideIcon,
          color: config.color,
          label: config.label,
          isHighlight: true,
        });
      });
    });
    return result;
  }, [showHelp, activeLayers]);

  const handleClick = useCallback(
    (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    },
    [onMapClick]
  );

  // Heatmap GeoJSON
  const heatmapGeoJson = useMemo(() => {
    if (!showHeatmap) return null;
    return {
      type: 'FeatureCollection',
      features: mockData.heatmapZones.map((zone) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [zone.lng, zone.lat] },
        properties: {
          radius: zone.radius,
          score: zone.score,
          color: scoreToColor(zone.score),
        },
      })),
    };
  }, [showHeatmap]);

  // Route GeoJSON
  const routeGeoJson = useMemo(() => {
    if (!route.start || !route.end) return null;
    const midLat = (route.start.lat + route.end.lat) / 2 + 0.002;
    const midLng = (route.start.lng + route.end.lng) / 2 - 0.001;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [route.start.lng, route.start.lat],
          [midLng, midLat],
          [route.end.lng, route.end.lat],
        ],
      },
    };
  }, [route]);

  const allMarkers = [...markers, ...helpMarkers];

  return (
    <div className="map-container">
      <MapGL
        initialViewState={{
          longitude: 14.4378,
          latitude: 50.0755,
          zoom: 14,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        onClick={handleClick}
        attributionControl={true}
      >
        <NavigationControl position="top-left" />

        {/* Heatmap circles */}
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

        {/* Route line */}
        {routeGeoJson && (
          <Source id="route-line" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-line-glow"
              type="line"
              paint={{
                'line-color': '#6366f1',
                'line-width': 12,
                'line-opacity': 0.15,
                'line-blur': 8,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id="route-line-main"
              type="line"
              paint={{
                'line-color': '#6366f1',
                'line-width': 4,
                'line-opacity': 0.9,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </Source>
        )}

        {/* Infrastructure markers */}
        {allMarkers.map((item) => {
          const IconComp = ICON_COMP[item.iconName];
          return (
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
                className={`map-marker ${item.isHighlight ? 'map-marker--highlight' : ''}`}
                style={{ '--marker-color': item.color }}
              >
                {IconComp && <IconComp size={item.isHighlight ? 18 : 14} />}
              </div>
            </Marker>
          );
        })}

        {/* Route start marker */}
        {route.start && (
          <Marker longitude={route.start.lng} latitude={route.start.lat} anchor="center">
            <div className="map-marker map-marker--start">
              <Flag size={16} />
            </div>
          </Marker>
        )}

        {/* Route end marker */}
        {route.end && (
          <Marker longitude={route.end.lng} latitude={route.end.lat} anchor="center">
            <div className="map-marker map-marker--end">
              <MapPin size={16} />
            </div>
          </Marker>
        )}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            offset={20}
          >
            <div className="popup-name">{popupInfo.name}</div>
            <div className="popup-type">{popupInfo.label}</div>
          </Popup>
        )}
      </MapGL>
    </div>
  );
}
