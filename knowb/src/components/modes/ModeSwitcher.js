import React from 'react';
import { MODES } from '../../data/modes';
import {
  Accessibility,
  Heart,
  Map,
  LayoutGrid,
} from 'lucide-react';

const ICON_MAP = {
  Accessibility,
  Heart,
  Map,
  LayoutGrid,
};

export default function ModeSwitcher({ activeMode, onModeChange, t }) {
  return (
    <div className="mode-section">
      <nav className="mode-switcher" role="tablist" aria-label="Navigation mode">
        {Object.values(MODES).map((mode) => {
          const IconComp = ICON_MAP[mode.lucideIcon];
          return (
            <button
              key={mode.id}
              role="tab"
              aria-selected={activeMode === mode.id}
              aria-label={`${t[`mode_${mode.id}`]} mode`}
              className={`mode-btn ${activeMode === mode.id ? 'mode-btn--active' : ''}`}
              onClick={() => onModeChange(mode.id)}
            >
              <span className="mode-btn__icon">
                {IconComp && <IconComp size={18} />}
              </span>
              <span className="mode-btn__label">{t[`mode_${mode.id}`]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
