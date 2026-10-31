import React from 'react';
import './DashCard.css';

export const DashCard = ({ title, value, subtitle, trend, trendDirection = 'up', icon }) => {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <span className="dash-card-title">{title}</span>
        {icon && <span className="dash-card-icon">{icon}</span>}
      </div>
      <div className="dash-card-value">{value}</div>
      {(subtitle || trend) && (
        <div className="dash-card-footer">
          {trend && (
            <span
              className={
                trendDirection === 'up' ? 'dash-card-trend-up' : 'dash-card-trend-down'
              }
            >
              {trendDirection === 'up' ? '↑' : '↓'} {trend}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default DashCard;
