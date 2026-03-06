import React from 'react';

export default function RoutePanel({
  startText,
  endText,
  onStartChange,
  onEndChange,
  onStartClick,
  onClear,
  settingPoint,
}) {
  return (
    <div className="route-panel">
      <div className="route-panel__inputs">
        <input
          className="route-input"
          type="text"
          placeholder="📍 Start"
          value={startText}
          onChange={(e) => onStartChange(e.target.value)}
          aria-label="Start location"
          readOnly
        />
        <input
          className="route-input"
          type="text"
          placeholder="📍 Destination"
          value={endText}
          onChange={(e) => onEndChange(e.target.value)}
          aria-label="Destination"
          readOnly
        />
      </div>
      <div className="route-panel__actions">
        <button
          className={`route-btn route-btn--start ${settingPoint === 'start' ? '' : ''}`}
          onClick={onStartClick}
          aria-label={
            settingPoint === 'start'
              ? 'Tap the map to set start'
              : settingPoint === 'end'
              ? 'Tap the map to set destination'
              : 'Set route points'
          }
        >
          {settingPoint === 'start'
            ? '👆 Tap map: Start'
            : settingPoint === 'end'
            ? '👆 Tap map: Destination'
            : '🗺️ Set Route'}
        </button>
        <button
          className="route-btn route-btn--clear"
          onClick={onClear}
          aria-label="Clear route"
        >
          ✕ Clear
        </button>
      </div>
    </div>
  );
}
