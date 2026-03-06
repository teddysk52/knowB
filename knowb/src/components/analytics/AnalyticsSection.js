import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { infrastructureCounts, districtScores } from '../../data/mockData';

const INFRA_COLORS = ['#8B6914', '#2563EB', '#DC2626', '#059669', '#7C3AED', '#0891B2', '#EA580C'];

function scoreColor(score) {
  if (score >= 70) return '#059669';
  if (score >= 50) return '#f59e0b';
  return '#dc2626';
}

export default function AnalyticsSection({ theme, t }) {
  const isDark = theme === 'dark';
  const tickFill = isDark ? '#555d75' : '#8b92a8';
  const gridStroke = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const tooltipStyle = {
    borderRadius: '10px',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
    background: isDark ? 'rgba(17,19,24,0.95)' : 'rgba(255,255,255,0.95)',
    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)',
    fontSize: '12px',
    color: isDark ? '#f1f3f9' : '#1a1d2e',
    backdropFilter: 'blur(12px)',
  };
  const itemStyle = { color: isDark ? '#f1f3f9' : '#1a1d2e' };
  const labelStyle = { color: isDark ? '#8b92a8' : '#555d75', fontWeight: 600, marginBottom: 4 };
  return (
    <section className="analytics-section" aria-label="Analytics">
      <div className="analytics-section__inner">
        <div className="section-header">
          <div className="section-header__eyebrow">{t.analytics}</div>
          <h2 className="section-header__title">{t.analytics_title}</h2>
          <p className="section-header__subtitle">
            {t.analytics_subtitle}
          </p>
        </div>

        <div className="charts-grid">
          {/* Infrastructure Coverage */}
          <div className="chart-card">
            <div className="chart-card__title">{t.chart_infra}</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={infrastructureCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={itemStyle}
                  labelStyle={labelStyle}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {infrastructureCounts.map((_, i) => (
                    <Cell key={i} fill={INFRA_COLORS[i % INFRA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-card__desc">
              {t.chart_infra_desc}
            </div>
          </div>

          {/* Accessibility by District */}
          <div className="chart-card">
            <div className="chart-card__title">{t.chart_district}</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={districtScores} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={itemStyle}
                  labelStyle={labelStyle}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {districtScores.map((entry, i) => (
                    <Cell key={i} fill={scoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-card__desc">
              {t.chart_district_desc}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
