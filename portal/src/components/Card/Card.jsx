import React from 'react';
import './Card.css';

/**
 * Reusable Card component with compound components for clean composition.
 * Variants: 'default', 'hero' (green radiant), 'alert' (red border)
 */
export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const variantClass = variant !== 'default' ? `card--${variant}` : '';
  const fullClassName = ['card', variantClass, className].filter(Boolean).join(' ');

  return (
    <div className={fullClassName} {...props}>
      {children}
    </div>
  );
}

export function CardLabel({ children, className = '', ...props }) {
  return (
    <div className={`card__label ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardValue({ children, className = '', ...props }) {
  return (
    <div className={`card__value ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardDelta({ children, trend = 'up', className = '', ...props }) {
  const trendClass = trend === 'down' ? 'card__delta--down' : '';
  return (
    <div className={`card__delta ${trendClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

Card.Label = CardLabel;
Card.Value = CardValue;
Card.Delta = CardDelta;
