import React from 'react';
import './Button.css';

/**
 * Reusable Button component following Brightloop design reference.
 * Variants: 'default', 'primary', 'danger', 'glass'
 * Sizes: 'sm', 'md' (default)
 */
export function Button({
  children,
  variant = 'default',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  icon,
  onClick,
  ...props
}) {
  const variantClass = variant !== 'default' ? `btn--${variant}` : '';
  const sizeClass = size === 'sm' ? 'btn--sm' : '';
  const fullClassName = ['btn', variantClass, sizeClass, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={fullClassName}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="btn__icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
