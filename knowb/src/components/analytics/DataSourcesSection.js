import React from 'react';
import { Database, Globe, MapPinned } from 'lucide-react';

const sources = [
  {
    Icon: Database,
    title: 'Prague Open Data Portal',
    text: 'Official datasets published by Prague City Hall, including public infrastructure, transport, and accessibility data.',
  },
  {
    Icon: Globe,
    title: 'Golemio API',
    text: 'Prague\'s smart-city data platform providing real-time and static datasets on urban mobility, waste, parking, and more.',
  },
  {
    Icon: MapPinned,
    title: 'OpenStreetMap',
    text: 'Community-driven geographic data used as the base map layer, enriched with accessibility tags and building footprints.',
  },
];

export default function DataSourcesSection() {
  return (
    <section className="data-section" aria-label="Data sources">
      <div className="data-section__inner">
        <div className="section-header">
          <div className="section-header__eyebrow">Data Integration</div>
          <h2 className="section-header__title">Data Sources</h2>
          <p className="section-header__subtitle">
            KnowB aggregates public city datasets to improve urban accessibility
          </p>
        </div>

        <div className="data-grid">
          {sources.map(({ Icon, title, text }) => (
            <div className="data-card" key={title}>
              <div className="data-card__icon">
                <Icon size={20} />
              </div>
              <div className="data-card__title">{title}</div>
              <div className="data-card__text">{text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
