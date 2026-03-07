import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import MapGL, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toGeoJsonFC } from '../../data/pragueData';
import {
  Navigation as NavIcon, MapPin, Loader2, Crosshair,
  Armchair, ArrowUpDown, HeartPulse, Hospital, Car, Footprints, Droplets,
} from 'lucide-react';

const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

// ── POI layer configs ──────────────────────────────────────────────
// Large datasets (benches/stairs) → native MapLibre circle layers only
// Small datasets (rest) → circle clusters + React Marker icons at zoom
// WC icon as inline SVG component (lucide doesn't have a toilet icon)
const ToiletIcon = ({ size = 14, color = 'currentColor', strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 12h10a2 2 0 0 1 2 2v1a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-1a2 2 0 0 1 2-2z"/>
    <path d="M6 8v4"/><path d="M18 8v4"/>
    <path d="M8 4h8v4H8z" fill={color} stroke="none"/>
  </svg>
);

const POI_LAYERS = {
  benches:         { color: '#92400e', label: 'Lavičky',       minZoom: 13, iconMinZoom: 16, Icon: Armchair,    iconSize: 14 },
  stairs:          { color: '#6b7280', label: 'Schody',        minZoom: 14, iconMinZoom: 16, Icon: Footprints,  iconSize: 14 },
  toilets:         { color: '#3b82f6', label: 'WC',            minZoom: 12, iconMinZoom: 14, Icon: ToiletIcon,  iconSize: 14 },
  elevators:       { color: '#8b5cf6', label: 'Výtahy',        minZoom: 12, iconMinZoom: 14, Icon: ArrowUpDown, iconSize: 14 },
  drinkingWater:   { color: '#06b6d4', label: 'Pitka',         minZoom: 12, iconMinZoom: 14, Icon: Droplets,    iconSize: 14 },
  aed:             { color: '#ef4444', label: 'AED',           minZoom: 10, iconMinZoom: 12, Icon: HeartPulse,  iconSize: 16 },
  clinics:         { color: '#dc2626', label: 'Kliniky',       minZoom: 10, iconMinZoom: 11, Icon: Hospital,    iconSize: 16 },
  disabledParking: { color: '#1e3a5f', label: 'P-ZTP',        minZoom: 13, iconMinZoom: 14, Icon: Car,         iconSize: 14 },
};

// Keys with small enough datasets or high-zoom icon markers
const ICON_MARKER_KEYS = ['benches', 'toilets', 'elevators', 'drinkingWater', 'aed', 'clinics', 'disabledParking'];

export default function CityMap({
  theme, activeMode, route, routeData, bestRouteIndex,
  onMapClick, settingPoint, showHeatmap, showHelp, showPOIs, isLoadingRoute, t,
  userPosition, navigating, pragueData, onLocateMe, setUserPosition, setGpsError,
}) {
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 14.4378,
    latitude: 50.0755,
    zoom: 14,
  });

  const mapRef = useRef(null);
  const preNavZoom = useRef(14);

  const centeredOnUser = useRef(false);
  useEffect(() => {
    if (userPosition && !centeredOnUser.current) {
      setViewState(prev => ({
        ...prev,
        longitude: userPosition.lng,
        latitude: userPosition.lat,
      }));
      centeredOnUser.current = true;
    }
  }, [userPosition]);

  // Zoom into navigation mode or zoom back out
  const prevNavigating = useRef(false);
  useEffect(() => {
    if (navigating && !prevNavigating.current) {
      // Entering navigation — snap to route start (green arrow)
      preNavZoom.current = viewState.zoom;
      const center = route.start ? { lng: route.start.lng, lat: route.start.lat } : null;
      if (center) {
        // Force React viewState so no re-render can override this
        setViewState({
          longitude: center.lng,
          latitude: center.lat,
          zoom: 18,
          pitch: 0,
          bearing: 0,
        });
      }
    } else if (!navigating && prevNavigating.current) {
      // Leaving navigation — zoom back out
      setViewState(prev => ({
        ...prev,
        zoom: 14,
        pitch: 0,
      }));
    }
    prevNavigating.current = navigating;
  }, [navigating]);

  // ── Build GeoJSON for clusters ──
  const allGeoJsons = useMemo(() => {
    if (!pragueData || !showPOIs) return {};
    const result = {};
    Object.keys(POI_LAYERS).forEach((key) => {
      if (pragueData[key] && pragueData[key].length > 0) {
        result[key] = toGeoJsonFC(pragueData[key], key);
      }
    });
    return result;
  }, [pragueData, showPOIs]);

  // ── Visible individual markers for small datasets ──
  const visibleMarkers = useMemo(() => {
    if (!pragueData || !showPOIs) return [];
    const markers = [];
    const zoom = viewState.zoom;
    ICON_MARKER_KEYS.forEach((key) => {
      const cfg = POI_LAYERS[key];
      if (zoom < cfg.iconMinZoom) return;
      const items = pragueData[key];
      if (!items) return;
      // Only show markers within viewport bounds (rough filter)
      const lngRange = 360 / Math.pow(2, zoom) * 0.7;
      const latRange = 180 / Math.pow(2, zoom) * 0.7;
      const cLng = viewState.longitude;
      const cLat = viewState.latitude;
      items.forEach((item) => {
        if (Math.abs(item.lng - cLng) < lngRange && Math.abs(item.lat - cLat) < latRange) {
          markers.push({ ...item, layerKey: key });
        }
      });
    });
    return markers;
  }, [pragueData, showPOIs, viewState.zoom, viewState.longitude, viewState.latitude]);

  const handleClick = useCallback(
    (e) => {
      if (onMapClick && settingPoint) {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    },
    [onMapClick, settingPoint]
  );

  const sortedRoutes = useMemo(() => {
    if (!routeData || routeData.length === 0) return [];
    const best = routeData[bestRouteIndex];
    if (!best) return [];
    return [{ ...best, index: bestRouteIndex }];
  }, [routeData, bestRouteIndex]);

  const cursorStyle = settingPoint ? 'crosshair' : 'grab';

  return (
    <div className="map-container">
      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES[theme]}
        onClick={handleClick}
        cursor={cursorStyle}
        attributionControl={true}
      >
        <NavigationControl position="top-left" />

        {/* ── Locate me button ── */}
        <div className="map-locate-btn-wrap">
          <button
            className="map-locate-btn"
            onClick={() => {
              if (userPosition) {
                setViewState(prev => ({
                  ...prev,
                  longitude: userPosition.lng,
                  latitude: userPosition.lat,
                  zoom: Math.max(prev.zoom, 16),
                }));
              } else if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserPosition(loc);
                    setViewState(prev => ({
                      ...prev,
                      longitude: loc.lng,
                      latitude: loc.lat,
                      zoom: Math.max(prev.zoom, 16),
                    }));
                  },
                  () => {
                    if (setGpsError) {
                      setGpsError(t.gps_error);
                      setTimeout(() => setGpsError(null), 5000);
                    }
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }
            }}
            aria-label={t.my_location}
            title={t.my_location}
          >
            <Crosshair size={18} />
          </button>
        </div>

        {/* ── POI cluster layers (native MapLibre) ── */}
        {Object.entries(allGeoJsons).map(([key, geojson]) => {
          const cfg = POI_LAYERS[key];
          const isIconLayer = ICON_MARKER_KEYS.includes(key);
          return (
            <Source
              key={`poi-${key}`}
              id={`poi-${key}`}
              type="geojson"
              data={geojson}
              cluster={true}
              clusterMaxZoom={isIconLayer ? cfg.iconMinZoom - 1 : 17}
              clusterRadius={45}
            >
              {/* Cluster circles */}
              <Layer
                id={`poi-${key}-cluster`}
                type="circle"
                filter={['has', 'point_count']}
                paint={{
                  'circle-color': cfg.color,
                  'circle-radius': ['step', ['get', 'point_count'], 14, 50, 18, 200, 24],
                  'circle-opacity': 0.75,
                  'circle-stroke-width': 1.5,
                  'circle-stroke-color': 'rgba(255,255,255,0.8)',
                  'circle-stroke-opacity': 1,
                }}
                minzoom={cfg.minZoom}
              />
              {/* Cluster count */}
              <Layer
                id={`poi-${key}-count`}
                type="symbol"
                filter={['has', 'point_count']}
                layout={{
                  'text-field': '{point_count_abbreviated}',
                  'text-size': 12,
                  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                }}
                paint={{ 'text-color': '#fff' }}
                minzoom={cfg.minZoom}
              />
              {/* Individual dots — only for large datasets (benches/stairs) */}
              {!isIconLayer && (
                <Layer
                  id={`poi-${key}-dot`}
                  type="circle"
                  filter={['!', ['has', 'point_count']]}
                  paint={{
                    'circle-color': cfg.color,
                    'circle-radius': 5,
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#fff',
                    'circle-stroke-opacity': 0.8,
                  }}
                  minzoom={cfg.minZoom}
                />
              )}
            </Source>
          );
        })}

        {/* ── Individual POI markers with icons (small datasets) ── */}
        {visibleMarkers.map((item) => {
          const cfg = POI_LAYERS[item.layerKey];
          const IconComp = cfg.Icon;
          return (
            <Marker
              key={`${item.layerKey}-${item.id}`}
              longitude={item.lng}
              latitude={item.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupInfo({ lat: item.lat, lng: item.lng, name: item.name, label: cfg.label });
              }}
            >
              <div className="poi-icon-marker" style={{ background: cfg.color }}>
                <IconComp size={cfg.iconSize} color="#fff" strokeWidth={2.5} />
              </div>
            </Marker>
          );
        })}

        {/* ── Route line ── */}
        {sortedRoutes.map(({ coordinates, index }) => {
          const geojson = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates },
          };
          return (
            <Source key={`route-${index}`} id={`route-${index}`} type="geojson" data={geojson}>
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
              <Layer
                id={`route-line-${index}`}
                type="line"
                paint={{
                  'line-color': '#6366f1',
                  'line-width': 5,
                  'line-opacity': 1,
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </Source>
          );
        })}

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

        {userPosition && (
          <Marker longitude={userPosition.lng} latitude={userPosition.lat} anchor="center">
            <div className="user-position-dot" />
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
            <div className="popup-name">{popupInfo.name || popupInfo.label}</div>
            {popupInfo.label && popupInfo.name && (
              <div className="popup-type">{popupInfo.label}</div>
            )}
          </Popup>
        )}
      </MapGL>

      {isLoadingRoute && (
        <div className="map-loading">
          <Loader2 size={18} className="spin" />
        </div>
      )}
    </div>
  );
}
