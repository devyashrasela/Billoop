import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../features/ui/uiSlice';
import './ToastContainer.css';

export function ToastContainer() {
  const toasts = useSelector((state) => state.ui?.toasts || []);
  const dispatch = useDispatch();

  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      // Auto-remove oldest toast after 4.5s
      dispatch(removeToast(toasts[0].id));
    }, 4500);

    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type || 'info'}`}
          role="status"
        >
          <div className="toast__content">{t.message}</div>
          <button
            type="button"
            className="toast__close"
            onClick={() => dispatch(removeToast(t.id))}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
