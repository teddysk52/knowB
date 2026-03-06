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

export default function AnalyticsSection() {
  return (
    <section className="analytics-section" aria-label="Analytics">
      <div className="analytics-section__inner">
        <div className="section-header">
          <div className="section-header__eyebrow">Analytics</div>
          <h2 className="section-header__title">City Accessibility Overview</h2>
          <p className="section-header__subtitle">
            Aggregated infrastructure data across Prague districts
          </p>
        </div>

        <div className="charts-grid">
          {/* Infrastructure Coverage */}
          <div className="chart-card">
            <div className="chart-card__title">Infrastructure Coverage</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={infrastructureCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#555d75' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#555d75' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(17,19,24,0.95)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    fontSize: '12px',
                    color: '#f1f3f9',
                    backdropFilter: 'blur(12px)',
                  }}
                  itemStyle={{ color: '#f1f3f9' }}
                  labelStyle={{ color: '#8b92a8', fontWeight: 600, marginBottom: 4 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {infrastructureCounts.map((_, i) => (
                    <Cell key={i} fill={INFRA_COLORS[i % INFRA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-card__desc">
              Total infrastructure points available in open city datasets.
            </div>
          </div>

          {/* Accessibility by District */}
          <div className="chart-card">
            <div className="chart-card__title">Accessibility by District</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={districtScores} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#555d75' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#555d75' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(17,19,24,0.95)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    fontSize: '12px',
                    color: '#f1f3f9',
                    backdropFilter: 'blur(12px)',
                  }}
                  itemStyle={{ color: '#f1f3f9' }}
                  labelStyle={{ color: '#8b92a8', fontWeight: 600, marginBottom: 4 }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {districtScores.map((entry, i) => (
                    <Cell key={i} fill={scoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-card__desc">
              Composite score based on density of benches, toilets, elevators, and AEDs per district.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
