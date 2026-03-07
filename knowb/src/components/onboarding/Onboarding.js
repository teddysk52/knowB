import React, { useState } from 'react';
import { Accessibility, Heart, ChevronRight, ChevronLeft, Type } from 'lucide-react';
import translations from '../../data/i18n';

const LANGUAGES = [
  { code: 'cs', flag: '🇨🇿', name: 'Čeština' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'uk', flag: '🇺🇦', name: 'Українська' },
];

const USER_TYPES = [
  { id: 'wheelchair', Icon: Accessibility, color: '#6366f1' },
  { id: 'senior', Icon: Heart, color: '#ef4444' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState(null);
  const [userType, setUserType] = useState(null);
  const [fontSize, setFontSize] = useState('xl');

  const t = translations[lang] || translations.cs;

  const FONT_SIZES = [
    { key: 'small', px: 14, label: t.onboarding_font_small },
    { key: 'medium', px: 17, label: t.onboarding_font_medium },
    { key: 'large', px: 20, label: t.onboarding_font_large },
    { key: 'xl', px: 24, label: t.onboarding_font_xl },
  ];

  // Step 0: Language
  if (step === 0) {
    return (
      <div className="onb">
        <div className="onb__inner">
          <div className="onb__step-dots">
            <span className="onb__dot onb__dot--active" />
            <span className="onb__dot" />
            <span className="onb__dot" />
          </div>

          <h1 className="onb__title">🌐</h1>

          <div className="onb__cards onb__cards--2">
            {LANGUAGES.map(({ code, flag, name }) => (
              <button
                key={code}
                className={`onb__card ${lang === code ? 'onb__card--selected' : ''}`}
                onClick={() => setLang(code)}
              >
                <span className="onb__card-emoji">{flag}</span>
                <span className="onb__card-label">{name}</span>
              </button>
            ))}
          </div>

          {lang && (
            <button className="onb__btn" onClick={() => setStep(1)}>
              {t.onboarding_next} <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Who are you
  if (step === 1) {
    return (
      <div className="onb">
        <div className="onb__inner">
          <div className="onb__step-dots">
            <span className="onb__dot" />
            <span className="onb__dot onb__dot--active" />
            <span className="onb__dot" />
          </div>

          <h1 className="onb__title">{t.onboarding_who_title}</h1>

          <div className="onb__cards onb__cards--2">
            {USER_TYPES.map(({ id, Icon, color }) => (
              <button
                key={id}
                className={`onb__card ${userType === id ? 'onb__card--selected' : ''}`}
                onClick={() => setUserType(id)}
              >
                <span className="onb__card-icon" style={{ background: color }}>
                  <Icon size={28} />
                </span>
                <span className="onb__card-label">{t[`user_${id}`]}</span>
              </button>
            ))}
          </div>

          <div className="onb__nav">
            <button className="onb__btn onb__btn--back" onClick={() => setStep(0)}>
              <ChevronLeft size={20} />
            </button>
            {userType && (
              <button className="onb__btn" onClick={() => setStep(2)}>
                {t.onboarding_next} <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Font size
  const currentPx = FONT_SIZES.find((f) => f.key === fontSize)?.px || 17;

  return (
    <div className="onb">
      <div className="onb__inner">
        <div className="onb__step-dots">
          <span className="onb__dot" />
          <span className="onb__dot" />
          <span className="onb__dot onb__dot--active" />
        </div>

        <h1 className="onb__title">{t.onboarding_font_title}</h1>

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
          <p>{t.onboarding_sample}</p>
        </div>

        <div className="onb__nav">
          <button className="onb__btn onb__btn--back" onClick={() => setStep(1)}>
            <ChevronLeft size={20} />
          </button>
          <button
            className="onb__btn onb__btn--start"
            onClick={() => onComplete({ lang, userType, fontSize: currentPx })}
          >
            {t.onboarding_start} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
