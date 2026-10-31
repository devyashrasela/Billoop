import React from 'react';
import './Badge.css';

/**
 * Semantic status badge.
 * Status options:
 * - Green: 'active', 'paid', 'success'
 * - Blue: 'confirmed', 'info'
 * - Amber: 'quotation', 'partial', 'pending', 'warning'
 * - Grey: 'draft', 'closed', 'neutral'
 * - Red: 'overdue', 'cancelled', 'danger'
 */
const STATUS_MAP = {
  active: 'paid',
  paid: 'paid',
  confirmed: 'confirmed',
  quotation: 'quotation',
  partial: 'partial',
  draft: 'draft',
  closed: 'closed',
  overdue: 'overdue',
  cancelled: 'cancelled',
};

export function Badge({
  children,
  status = 'neutral',
  className = '',
  ...props
}) {
  const normalizedStatus = STATUS_MAP[status.toLowerCase()] || status;
  const fullClassName = ['badge', `badge--${normalizedStatus}`, className].filter(Boolean).join(' ');

  return (
    <span className={fullClassName} {...props}>
      {children}
    </span>
  );
}

