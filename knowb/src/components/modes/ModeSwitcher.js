import React from 'react';
import { MODES } from '../../data/modes';

export default function ModeSwitcher({ activeMode, onModeChange }) {
  return (
    <nav className="mode-switcher" role="tablist" aria-label="Navigation mode">
      {Object.values(MODES).map((mode) => (
        <button
          key={mode.id}
          role="tab"
          aria-selected={activeMode === mode.id}
          aria-label={`${mode.label} mode: ${mode.description}`}
          className={`mode-btn ${activeMode === mode.id ? 'mode-btn--active' : ''}`}
          onClick={() => onModeChange(mode.id)}
        >
          <span className="mode-btn__icon" aria-hidden="true">{mode.icon}</span>
          <span className="mode-btn__label">{mode.label}</span>
        </button>
      ))}
    </nav>
  );
}
