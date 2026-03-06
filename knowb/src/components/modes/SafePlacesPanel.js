import React from 'react';

const SAFE_PLACE_TYPES = [
  { id: 'home', icon: '🏠', label: 'Home', lat: 50.0800, lng: 14.4250 },
  { id: 'school', icon: '🏫', label: 'School', lat: 50.0830, lng: 14.4350 },
  { id: 'park', icon: '🌳', label: 'Park', lat: 50.0770, lng: 14.4160 },
  { id: 'grandparents', icon: '👵', label: 'Grandparents', lat: 50.0850, lng: 14.4450 },
];

export default function SafePlacesPanel({ savedPlaces, onTogglePlace }) {
  return (
    <div className="safe-places" role="complementary" aria-label="Safe places">
      <div className="safe-places__title">Safe Places</div>
      <ul className="safe-places__list">
        {SAFE_PLACE_TYPES.map((place) => {
          const isSaved = savedPlaces.some((p) => p.id === place.id);
          return (
            <li key={place.id}>
              <button
                className={`safe-place-btn ${isSaved ? 'safe-place-btn--saved' : ''}`}
                onClick={() => onTogglePlace(place)}
                aria-label={`${isSaved ? 'Remove' : 'Save'} ${place.label} as safe place`}
                aria-pressed={isSaved}
              >
                <span className="safe-place-btn__icon" aria-hidden="true">{place.icon}</span>
                <span>{place.label}</span>
                {isSaved && <span style={{ marginLeft: 'auto', color: '#16a34a' }}>✓</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
