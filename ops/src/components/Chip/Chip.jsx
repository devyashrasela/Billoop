import React from 'react';
import './Chip.css';

/**
 * Filter Chip / Segmented Toggle Button as seen in the toolbar filter.
 */
export function Chip({
  label,
  children,
  active = false,
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`chip ${active ? 'chip--active' : ''} ${className}`}
      aria-pressed={active}
      onClick={onClick}
      {...props}
    >
      {children || label}
    </button>
  );
}

export function Toolbar({ children, className = '', ...props }) {
  return (
    <div className={`toolbar ${className}`} role="group" {...props}>
      {children}
    </div>
  );
}

