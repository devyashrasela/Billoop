import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPortalSubscriptionsQuery } from '../../services/endpoints/portalApi';
import { Button, Badge, Chip } from '../../components';
import './SubscriptionList.css';

const STATUS_FILTERS = [
  { key: '', label: 'All Subscriptions' },
  { key: 'active', label: 'Active' },
  { key: 'quotation', label: 'Quotations' },
  { key: 'closed', label: 'Closed' },
];

export default function SubscriptionList() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data, isLoading } = useGetPortalSubscriptionsQuery({
    status: selectedStatus || undefined,
  });

  const subscriptions = data?.data || [];

  const getStatusBadge = (sub) => {
    if (sub.isPaused) {
      return <Badge variant="warning" size="sm">PAUSED</Badge>;
    }
    switch (sub.status) {
      case 'active':
        return <Badge variant="success" size="sm">ACTIVE</Badge>;
      case 'quotation':
        return <Badge variant="info" size="sm">QUOTATION</Badge>;
      case 'closed':
        return <Badge variant="danger" size="sm">CLOSED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{sub.status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="portal-sub-page">
      <div className="portal-sub-header">
        <div>
          <h1>My Subscriptions</h1>
          <p>View your active recurring plans, billing cycles, and self-service renewals</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/plans')}>
          Explore New Plans
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            active={selectedStatus === f.key}
            onClick={() => setSelectedStatus(f.key)}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          Loading your subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="portal-empty-card">
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>No Subscriptions Found</h3>
          <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem 0' }}>
            You do not currently have any subscriptions matching this filter.
          </p>
          <Button variant="primary" onClick={() => navigate('/plans')}>
            Browse Subscription Plans
          </Button>
        </div>
      ) : (
        <div className="portal-sub-grid">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="portal-sub-card">
              <div>
                <div className="portal-sub-card__top">
                  <div>
                    <h2 className="portal-sub-card__title">
                      {sub.plan?.name || 'Subscription Service'}
                    </h2>
                    <span className="portal-sub-card__number">{sub.number}</span>
                  </div>
                  {getStatusBadge(sub)}
                </div>

                <div className="portal-sub-card__price">
                  ${Number(sub.recurringTotal || 0).toFixed(2)}
                  <small> / {sub.plan?.billingPeriod || 'period'}</small>
                </div>

                <div className="portal-sub-card__details">
                  <div className="portal-sub-card__row">
                    <span>Started:</span>
                    <strong>{sub.startDate || '—'}</strong>
                  </div>
                  <div className="portal-sub-card__row">
                    <span>Next Billing:</span>
                    <strong>{sub.nextBillingDate || '—'}</strong>
                  </div>
                  {sub.expiryDate && (
                    <div className="portal-sub-card__row">
                      <span>Renewal / Expiry:</span>
                      <strong>{sub.expiryDate}</strong>
                    </div>
                  )}
                  {sub.paymentTerm && (
                    <div className="portal-sub-card__row">
                      <span>Payment Terms:</span>
                      <strong>{sub.paymentTerm.name}</strong>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate(`/subscriptions/${sub.id}`)}
              >
                Manage Subscription →
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
