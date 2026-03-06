import React, { useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MODES, LAYER_CONFIG } from '../../data/modes';
import * as mockData from '../../data/mockData';

// Prague center
const PRAGUE_CENTER = [50.0755, 14.4378];
const DEFAULT_ZOOM = 14;

// Data key mapping
const DATA_MAP = {
  benches: mockData.benches,
  toilets: mockData.toilets,
  elevators: mockData.elevators,
  aed: mockData.aed,
  pharmacies: mockData.pharmacies,
  transport: mockData.transport,
  fountains: mockData.fountains,
  hospitals: mockData.hospitals,
  playgrounds: mockData.playgrounds,
  landmarks: mockData.landmarks,
};

function createIcon(emoji, isHighlight) {
  const size = isHighlight ? 48 : 40;
  return L.divIcon({
    html: `<div class="custom-marker ${isHighlight ? 'custom-marker--highlight' : ''}">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: '',
  });
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function CityMap({
  activeMode,
  route,
  onMapClick,
  savedPlaces,
}) {
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
          emoji: config.icon,
          label: config.label,
          isHighlight,
        });
      });
    });
    return result;
  }, [activeLayers, highlightLayers]);

  const handleMapClick = useCallback(
    (latlng) => {
      if (onMapClick) onMapClick(latlng);
    },
    [onMapClick]
  );

  // Generate a simple route line (straight segments between start/end via waypoints)
  const routeLine = useMemo(() => {
    if (!route.start || !route.end) return null;
    // Simple direct route with a slight curve through center
    const midLat = (route.start.lat + route.end.lat) / 2 + 0.002;
    const midLng = (route.start.lng + route.end.lng) / 2 - 0.001;
    return [
      [route.start.lat, route.start.lng],
      [midLat, midLng],
      [route.end.lat, route.end.lng],
    ];
  }, [route]);

  return (
    <div className="map-container">
      <MapContainer
        center={PRAGUE_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={true}
        attributionControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {markers.map((item) => (
          <Marker
            key={`${item.layerKey}-${item.id}`}
            position={[item.lat, item.lng]}
            icon={createIcon(item.emoji, item.isHighlight)}
          >
            <Popup>
              <strong>{item.emoji} {item.name}</strong>
              <br />
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{item.label}</span>
            </Popup>
          </Marker>
        ))}

        {/* Saved places for Kid Safe mode */}
        {savedPlaces.map((place) => (
          <Marker
            key={`safe-${place.id}`}
            position={[place.lat, place.lng]}
            icon={createIcon(place.icon, true)}
          >
            <Popup>
              <strong>{place.icon} {place.label}</strong>
              <br />
              <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>Safe Place</span>
            </Popup>
          </Marker>
        ))}

        {/* Route start marker */}
        {route.start && (
          <Marker
            position={[route.start.lat, route.start.lng]}
            icon={createIcon('🟢', false)}
          >
            <Popup>Start</Popup>
          </Marker>
        )}

        {/* Route end marker */}
        {route.end && (
          <Marker
            position={[route.end.lat, route.end.lng]}
            icon={createIcon('🔴', false)}
          >
            <Popup>Destination</Popup>
          </Marker>
        )}

        {/* Route line */}
        {routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: '#2563EB',
              weight: 5,
              opacity: 0.8,
              dashArray: '12, 8',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
