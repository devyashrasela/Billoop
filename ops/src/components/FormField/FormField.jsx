import React, { useId } from 'react';
import './FormField.css';

/**
 * Accessible form field with label, input slot, helper text, and validation errors.
 */
export function FormField({
  label,
  error,
  helperText,
  id: customId,
  required = false,
  className = '',
  children,
}) {
  const generatedId = useId();
  const id = customId || generatedId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id} className="field__label">
          {label}
          {required && <span className="field__required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="field__control">
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              id: children.props.id || id,
              'aria-invalid': error ? 'true' : undefined,
              'aria-describedby': error ? errorId : helperText ? helperId : undefined,
              className: [
                children.props.className,
                error ? 'input--error' : '',
              ].filter(Boolean).join(' '),
            })
          : children}
      </div>

      {error && (
        <span id={errorId} className="field__error" role="alert">
          {error}
        </span>
      )}

      {!error && helperText && (
        <span id={helperId} className="field__helper">
          {helperText}
        </span>
      )}
    </div>
  );
}

/**
 * Standard TextInput styled to design reference.
 */
export function Input({
  type = 'text',
  className = '',
  hasError = false,
  ...props
}) {
  const errorClass = hasError ? 'input--error' : '';
  return (
    <input
      type={type}
      className={['input', errorClass, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

/**
 * Standard Select styled to design reference.
 */
export function Select({
  className = '',
  hasError = false,
  children,
  ...props
}) {
  const errorClass = hasError ? 'input--error' : '';
  return (
    <select
      className={['input', 'select', errorClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </select>
  );
}

