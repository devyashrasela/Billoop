import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetPortalSubscriptionQuery,
  usePausePortalSubscriptionMutation,
  useResumePortalSubscriptionMutation,
  useRenewPortalSubscriptionMutation,
  useClosePortalSubscriptionMutation,
} from '../../services/endpoints/portalApi';
import {
  Button,
  Badge,
  Card,
  StatusStepper,
  Modal,
  FormField,
  Input,
} from '../../components';
import './SubscriptionDetail.css';

export default function SubscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: sub, isLoading, error } = useGetPortalSubscriptionQuery(id);
  const [pauseSub, { isLoading: isPausing }] = usePausePortalSubscriptionMutation();
  const [resumeSub, { isLoading: isResuming }] = useResumePortalSubscriptionMutation();
  const [renewSub, { isLoading: isRenewing }] = useRenewPortalSubscriptionMutation();
  const [closeSub, { isLoading: isClosing }] = useClosePortalSubscriptionMutation();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState('');

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
        Loading subscription details...
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--red)' }}>
        Subscription not found or access denied.
        <div style={{ marginTop: '1rem' }}>
          <Button variant="secondary" onClick={() => navigate('/subscriptions')}>
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  const plan = sub.plan || {};
  const isBusy = isPausing || isResuming || isRenewing || isClosing;

  const handlePause = async () => {
    setActionError('');
    try {
      await pauseSub(sub.id).unwrap();
    } catch (err) {
      setActionError(err.data?.message || 'Failed to pause subscription');
    }
  };

  const handleResume = async () => {
    setActionError('');
    try {
      await resumeSub(sub.id).unwrap();
    } catch (err) {
      setActionError(err.data?.message || 'Failed to resume subscription');
    }
  };

  const handleRenew = async () => {
    setActionError('');
    try {
      await renewSub(sub.id).unwrap();
    } catch (err) {
      setActionError(err.data?.message || 'Failed to renew subscription');
    }
  };

  const handleCancel = async () => {
    setActionError('');
    try {
      await closeSub({ id: sub.id, reason: cancelReason || 'Cancelled by customer via self-service' }).unwrap();
      setCancelModalOpen(false);
    } catch (err) {
      setActionError(err.data?.message || 'Failed to cancel subscription');
    }
  };

  return (
    <div className="portal-subdetail-page">
      <div className="portal-subdetail-nav">
        <Link to="/subscriptions">← Back to My Subscriptions</Link>
      </div>

      {actionError && (
        <div
          style={{
            background: 'var(--red-soft, #f6dcd9)',
            border: '1px solid var(--red-border, #e3b9b5)',
            color: 'var(--red, #b3261e)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm, 4px)',
          }}
        >
          {actionError}
        </div>
      )}

      <div className="portal-subdetail-header">
        <div className="portal-subdetail-title">
          <h1>{sub.number}</h1>
          <Badge
            variant={
              sub.status === 'active'
                ? 'success'
                : sub.status === 'closed'
                ? 'danger'
                : 'neutral'
            }
          >
            {sub.status.toUpperCase()}
          </Badge>
          {sub.isPaused && <Badge variant="warning">PAUSED</Badge>}
        </div>

        <div className="portal-subdetail-actions">
          {sub.status === 'active' && (
            <>
              {plan.allowPause && !sub.isPaused && (
                <Button variant="secondary" disabled={isBusy} onClick={handlePause}>
                  Pause Subscription
                </Button>
              )}
              {sub.isPaused && (
                <Button variant="secondary" disabled={isBusy} onClick={handleResume}>
                  Resume Subscription
                </Button>
              )}
              {plan.allowRenew && (
                <Button variant="secondary" disabled={isBusy} onClick={handleRenew}>
                  Renew Term
                </Button>
              )}
              {plan.allowEarlyClose && (
                <Button
                  variant="danger"
                  disabled={isBusy}
                  onClick={() => setCancelModalOpen(true)}
                >
                  Cancel Subscription
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="portal-stepper-wrap">
        <StatusStepper currentStatus={sub.status} />
      </div>

      <div className="portal-subdetail-grid">
        <Card title="Plan & Billing Details">
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Plan Name</span>
            <strong>{plan.name}</strong>
          </div>
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Billing Frequency</span>
            <strong style={{ textTransform: 'capitalize' }}>{plan.billingPeriod}</strong>
          </div>
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Recurring Rate</span>
            <strong style={{ color: 'var(--green, #1f7a4d)', fontSize: '1.1rem' }}>
              ${Number(sub.recurringTotal || 0).toFixed(2)}
            </strong>
          </div>
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Payment Terms</span>
            <strong>{sub.paymentTerm?.name || 'Immediate'}</strong>
          </div>
        </Card>

        <Card title="Contract Dates">
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Start Date</span>
            <strong>{sub.startDate || '—'}</strong>
          </div>
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Next Billing Date</span>
            <strong>{sub.nextBillingDate || '—'}</strong>
          </div>
          {sub.expiryDate && (
            <div className="portal-info-row">
              <span style={{ color: 'var(--muted)' }}>Current Term Expiry</span>
              <strong>{sub.expiryDate}</strong>
            </div>
          )}
          {sub.closedAt && (
            <div className="portal-info-row">
              <span style={{ color: 'var(--muted)' }}>Closed Date</span>
              <span style={{ color: 'var(--red, #b3261e)' }}>
                {new Date(sub.closedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </Card>
      </div>

      <Card title="Included Products & Services">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Service Item</th>
              <th>Variant</th>
              <th>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(sub.lines || []).map((line) => (
              <tr key={line.id}>
                <td>
                  <strong>{line.product?.name || `Item #${line.productId}`}</strong>
                  {line.description && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                      {line.description}
                    </div>
                  )}
                </td>
                <td>{line.variant?.attributeValues || '—'}</td>
                <td>{line.qty}</td>
                <td style={{ textAlign: 'right' }}>${Number(line.unitPrice).toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ${Number(line.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Subscription"
      >
        <p style={{ margin: '0 0 1rem 0', color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>
          Are you sure you want to cancel your subscription <strong>{sub.number}</strong>?
        </p>
        <FormField label="Reason for cancelling (optional)">
          <Input
            placeholder="e.g. Switching plans, budget, no longer needed"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
            Keep Subscription
          </Button>
          <Button variant="danger" disabled={isBusy} onClick={handleCancel}>
            {isClosing ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
