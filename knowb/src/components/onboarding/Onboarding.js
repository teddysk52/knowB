import React, { useState } from 'react';
import { Accessibility, Heart, Map, LayoutGrid, ChevronRight, ChevronLeft, Type } from 'lucide-react';

const FONT_SIZES = [
  { key: 'small', px: 14, label: 'Malý' },
  { key: 'medium', px: 17, label: 'Střední' },
  { key: 'large', px: 20, label: 'Velký' },
  { key: 'xl', px: 24, label: 'Velmi velký' },
];

const USER_TYPES = [
  { id: 'wheelchair', Icon: Accessibility, color: '#6366f1', label: 'Vozíčkář', desc: 'Výtahy, rampy, bezbariérové toalety' },
  { id: 'senior', Icon: Heart, color: '#ef4444', label: 'Senior', desc: 'Lavičky, lékárny, toalety poblíž' },
  { id: 'tourist', Icon: Map, color: '#f59e0b', label: 'Turista', desc: 'MHD, pítka, toalety' },
  { id: 'standard', Icon: LayoutGrid, color: '#10b981', label: 'Běžný občan', desc: 'Veškerá infrastruktura na mapě' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0); // 0=who, 1=font
  const [userType, setUserType] = useState(null);
  const [fontSize, setFontSize] = useState('medium');

  // Step 0: Who are you
  if (step === 0) {
    return (
      <div className="onb">
        <div className="onb__inner">
          <div className="onb__step-dots">
            <span className="onb__dot onb__dot--active" />
            <span className="onb__dot" />
          </div>

          <h1 className="onb__title">Kdo jste?</h1>
          <p className="onb__subtitle">Přizpůsobíme aplikaci vašim potřebám</p>

          <div className="onb__cards onb__cards--2">
            {USER_TYPES.map(({ id, Icon, color, label, desc }) => (
              <button
                key={id}
                className={`onb__card ${userType === id ? 'onb__card--selected' : ''}`}
                onClick={() => setUserType(id)}
              >
                <span className="onb__card-icon" style={{ background: color }}>
                  <Icon size={28} />
                </span>
                <span className="onb__card-label">{label}</span>
                <span className="onb__card-desc">{desc}</span>
              </button>
            ))}
          </div>

          {userType && (
            <button className="onb__btn" onClick={() => setStep(1)}>
              Další <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Font size
  const currentPx = FONT_SIZES.find((f) => f.key === fontSize)?.px || 17;

  return (
    <div className="onb">
      <div className="onb__inner">
        <div className="onb__step-dots">
          <span className="onb__dot" />
          <span className="onb__dot onb__dot--active" />
        </div>

        <h1 className="onb__title">Velikost textu</h1>
        <p className="onb__subtitle">Zvolte pohodlnou velikost pro čtení</p>

        <div className="onb__font-options">
          {FONT_SIZES.map(({ key, px, label }) => (
            <button
              key={key}
              className={`onb__font-btn ${fontSize === key ? 'onb__font-btn--active' : ''}`}
              onClick={() => setFontSize(key)}
            >
              <Type size={px * 0.9} />
              <span>{label}</span>
              <span className="onb__font-px">{px}px</span>
            </button>
          ))}
        </div>

        <div className="onb__preview" style={{ fontSize: `${currentPx}px` }}>
          <div className="onb__preview-label">Ukázkový text:</div>
          <p>Nejbližší lavička je 120 metrů od vás.</p>
        </div>

        <div className="onb__nav">
          <button className="onb__btn onb__btn--back" onClick={() => setStep(0)}>
            <ChevronLeft size={20} /> Zpět
          </button>
          <button
            className="onb__btn onb__btn--start"
            onClick={() => onComplete({ lang: 'cs', userType, fontSize: currentPx })}
          >
            Začít <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
