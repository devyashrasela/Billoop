import React from 'react';
import './StatusStepper.css';

const DEFAULT_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'quotation', label: 'Quotation' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
];

/**
 * StatusStepper component showing progression through subscription lifecycle states.
 */
export function StatusStepper({
  currentStatus = 'draft',
  steps = DEFAULT_STEPS,
  className = '',
}) {
  const currentIndex = steps.findIndex(
    (s) => s.key.toLowerCase() === currentStatus.toLowerCase()
  );

  return (
    <ol className={`stepper ${className}`} aria-label="Subscription Status">
      {steps.map((step, index) => {
        let stateClass = '';
        if (index < currentIndex) {
          stateClass = 'stepper__step--done';
        } else if (index === currentIndex) {
          stateClass = 'stepper__step--cur';
        }

        return (
          <li
            key={step.key}
            className={`stepper__step ${stateClass}`}
            aria-current={index === currentIndex ? 'step' : undefined}
          >
            <span className="stepper__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
