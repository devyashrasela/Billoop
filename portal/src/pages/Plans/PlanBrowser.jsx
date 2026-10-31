import React from 'react';
import { useGetPortalPlansQuery } from '../../services/endpoints/portalApi';
import { Button } from '../../components';
import './PlanBrowser.css';

export default function PlanBrowser() {
  const { data, isLoading } = useGetPortalPlansQuery();
  const plans = data?.data || [];

  return (
    <div className="portal-plans-page">
      <div className="portal-plans-header">
        <h1>Available Subscription Plans</h1>
        <p>
          Flexible recurring billing terms designed to support and scale with your business requirements
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          Loading available plans...
        </div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          No plans currently available for online enrollment. Please reach out to our team.
        </div>
      ) : (
        <div className="portal-plans-grid">
          {plans.map((p) => (
            <div key={p.id} className="portal-plan-card">
              <div>
                <h2 className="portal-plan-card__title">{p.name}</h2>
                <div className="portal-plan-card__price">
                  ${Number(p.price || 0).toFixed(2)}
                  <span> / {p.billingPeriod}</span>
                </div>

                <ul className="portal-plan-card__features">
                  <li>Billed on a recurring <strong>{p.billingPeriod}</strong> schedule</li>
                  {p.minQty > 1 && <li>Minimum quantity: {p.minQty} units</li>}
                  {p.allowPause && <li>Self-service pause & resume anytime</li>}
                  {p.allowRenew && <li>Self-service renewal extension</li>}
                  {p.allowEarlyClose && <li>Flexible early cancellation policy</li>}
                  {p.autoClose && <li>Automatic contract term closure</li>}
                </ul>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={() => alert(`To subscribe to ${p.name}, please contact your account representative or sales staff.`)}
              >
                Inquire & Subscribe
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
