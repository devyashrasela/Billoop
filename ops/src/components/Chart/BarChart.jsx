import React from 'react';
import './BarChart.css';

export const BarChart = ({ data = [], valuePrefix = '$', height = 220 }) => {
  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0), 1);

  return (
    <div className="bar-chart-container">
      <div className="bar-chart-bars" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const val = Number(item.value) || 0;
          const heightPercent = Math.max(Math.round((val / maxValue) * 100), 2);

          return (
            <div key={item.label || index} className="bar-chart-col">
              <span className="bar-chart-value-tooltip">
                {valuePrefix}
                {val.toLocaleString()}
              </span>
              <div
                className="bar-chart-fill"
                style={{ height: `${heightPercent}%` }}
                title={`${item.label}: ${valuePrefix}${val.toLocaleString()}`}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {data.map((item, index) => (
          <div key={item.label || index} style={{ flex: 1, textAlign: 'center' }}>
            <span className="bar-chart-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
