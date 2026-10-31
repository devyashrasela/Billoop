import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetSubscriptionQuery,
  useTransitionSubscriptionMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useRenewSubscriptionMutation,
  useCloseSubscriptionMutation,
} from '../../services/endpoints/subscriptionApi';
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

  const { data: sub, isLoading, error } = useGetSubscriptionQuery(id);
  const [transitionSub, { isLoading: isTransitioning }] = useTransitionSubscriptionMutation();
  const [pauseSub, { isLoading: isPausing }] = usePauseSubscriptionMutation();
  const [resumeSub, { isLoading: isResuming }] = useResumeSubscriptionMutation();
  const [renewSub, { isLoading: isRenewing }] = useRenewSubscriptionMutation();
  const [closeSub, { isLoading: isClosing }] = useCloseSubscriptionMutation();

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [actionError, setActionError] = useState('');

  if (isLoading) {
    return (
      <div className="sub-detail-page">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading subscription details...
        </div>
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="sub-detail-page">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger, #ef4444)' }}>
          Subscription not found or error loading record.
          <div style={{ marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => navigate('/subscriptions')}>
              Back to Subscriptions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleTransition = async (toStatus) => {
    setActionError('');
    try {
      await transitionSub({ id: sub.id, to: toStatus }).unwrap();
    } catch (err) {
      setActionError(err.data?.message || 'Failed to update subscription status');
    }
  };

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

  const handleClose = async () => {
    setActionError('');
    try {
      await closeSub({ id: sub.id, reason: closeReason || 'Closed by staff' }).unwrap();
      setCloseModalOpen(false);
    } catch (err) {
      setActionError(err.data?.message || 'Failed to close subscription');
    }
  };

  const plan = sub.plan || {};
  const isBusy = isTransitioning || isPausing || isResuming || isRenewing || isClosing;

  return (
    <div className="sub-detail-page">
      <div className="sub-detail-nav">
        <Link to="/subscriptions" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          ← Back to Subscriptions
        </Link>
      </div>

      {actionError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {actionError}
        </div>
      )}

      <div className="sub-detail-header">
        <div className="sub-detail-title">
          <h1>{sub.number}</h1>
          <Badge
            variant={
              sub.status === 'active'
                ? 'success'
                : sub.status === 'closed'
                ? 'danger'
                : sub.status === 'confirmed'
                ? 'warning'
                : 'info'
            }
          >
            {sub.status.toUpperCase()}
          </Badge>
          {sub.isPaused && <Badge variant="warning">PAUSED</Badge>}
        </div>

        <div className="sub-detail-actions">
          {sub.status === 'draft' && (
            <Button
              variant="primary"
              disabled={isBusy}
              onClick={() => handleTransition('quotation')}
            >
              Send Quotation
            </Button>
          )}

          {sub.status === 'quotation' && (
            <>
              <Button
                variant="primary"
                disabled={isBusy}
                onClick={() => handleTransition('confirmed')}
              >
                Confirm Quotation
              </Button>
              <Button
                variant="danger"
                disabled={isBusy}
                onClick={() => setCloseModalOpen(true)}
              >
                Reject & Close
              </Button>
            </>
          )}

          {sub.status === 'confirmed' && (
            <>
              <Button
                variant="primary"
                disabled={isBusy}
                onClick={() => handleTransition('active')}
              >
                Activate Subscription
              </Button>
              <Button
                variant="danger"
                disabled={isBusy}
                onClick={() => setCloseModalOpen(true)}
              >
                Close
              </Button>
            </>
          )}

          {sub.status === 'active' && (
            <>
              {plan.allowPause && !sub.isPaused && (
                <Button variant="secondary" disabled={isBusy} onClick={handlePause}>
                  Pause
                </Button>
              )}
              {sub.isPaused && (
                <Button variant="secondary" disabled={isBusy} onClick={handleResume}>
                  Resume
                </Button>
              )}
              {plan.allowRenew && (
                <Button variant="secondary" disabled={isBusy} onClick={handleRenew}>
                  Renew
                </Button>
              )}
              {plan.allowEarlyClose && (
                <Button variant="danger" disabled={isBusy} onClick={() => setCloseModalOpen(true)}>
                  Early Close
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stepper Card */}
      <div className="sub-stepper-card">
        <StatusStepper currentStatus={sub.status} />
      </div>

      {/* Overview Cards */}
      <div className="sub-detail-grid">
        <Card title="Customer Information">
          <div className="sub-info-list">
            <div className="sub-info-row">
              <span className="sub-info-label">Customer Name</span>
              <span className="sub-info-val">{sub.customer?.name}</span>
            </div>
            <div className="sub-info-row">
              <span className="sub-info-label">Company</span>
              <span className="sub-info-val">{sub.customer?.company || '—'}</span>
            </div>
            <div className="sub-info-row">
              <span className="sub-info-label">Phone</span>
              <span className="sub-info-val">{sub.customer?.phone || '—'}</span>
            </div>
            <div className="sub-info-row">
              <span className="sub-info-label">Address</span>
              <span className="sub-info-val">
                {[sub.customer?.addressLine1, sub.customer?.city, sub.customer?.country]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Subscription Terms">
          <div className="sub-info-list">
            <div className="sub-info-row">
              <span className="sub-info-label">Plan</span>
              <span className="sub-info-val">
                {plan.name} ({plan.billingPeriod})
              </span>
            </div>
            <div className="sub-info-row">
              <span className="sub-info-label">Payment Term</span>
              <span className="sub-info-val">{sub.paymentTerm?.name || 'Immediate'}</span>
            </div>
            <div className="sub-info-row">
              <span className="sub-info-label">Start Date</span>
              <span className="sub-info-val">{sub.startDate || '—'}</span>
            </div>
            <div className="sub-info-row">
              <span className="sub-info-label">Next Billing Date</span>
              <span className="sub-info-val">{sub.nextBillingDate || '—'}</span>
            </div>
            {sub.expiryDate && (
              <div className="sub-info-row">
                <span className="sub-info-label">Expiry Date</span>
                <span className="sub-info-val">{sub.expiryDate}</span>
              </div>
            )}
            {sub.quotationValidUntil && (
              <div className="sub-info-row">
                <span className="sub-info-label">Quotation Valid Until</span>
                <span className="sub-info-val">{sub.quotationValidUntil}</span>
              </div>
            )}
            {sub.closeReason && (
              <div className="sub-info-row">
                <span className="sub-info-label">Close Reason</span>
                <span className="sub-info-val" style={{ color: 'var(--color-danger, #ef4444)' }}>
                  {sub.closeReason}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Subscription Lines Table */}
      <Card title="Line Items" className="sub-lines-card">
        <table className="sub-lines-table">
          <thead>
            <tr>
              <th>Product / Service</th>
              <th>Variant</th>
              <th>Quantity</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th>Tax Rate</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(sub.lines || []).map((line) => (
              <tr key={line.id}>
                <td>
                  <strong>{line.product?.name || `Product #${line.productId}`}</strong>
                  {line.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {line.description}
                    </div>
                  )}
                </td>
                <td>{line.variant?.attributeValues || '—'}</td>
                <td>{line.qty}</td>
                <td style={{ textAlign: 'right' }}>${Number(line.unitPrice).toFixed(2)}</td>
                <td>{line.tax ? `${line.tax.rate}% (${line.tax.name})` : '0%'}</td>
                <td style={{ textAlign: 'right' }}>
                  <strong>${Number(line.amount).toFixed(2)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="sub-totals-box">
          <div className="sub-totals-inner">
            <div className="sub-info-row">
              <span className="sub-info-label">Subtotal</span>
              <span className="sub-info-val">
                ${(Number(sub.recurringTotal) - Number(sub.recurringTaxTotal || 0)).toFixed(2)}
              </span>
            </div>
            <div className="sub-info-row">
              <span className="sub-info-label">Taxes</span>
              <span className="sub-info-val">${Number(sub.recurringTaxTotal || 0).toFixed(2)}</span>
            </div>
            <div className="sub-info-row" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span>Recurring Total</span>
              <span style={{ color: 'var(--color-primary, #6366f1)' }}>
                ${Number(sub.recurringTotal || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Close Modal */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title="Close Subscription"
      >
        <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          Are you sure you want to close subscription <strong>{sub.number}</strong>?
        </div>
        <FormField label="Reason for closing">
          <Input
            placeholder="e.g. Customer cancelled, Non-payment, Upgraded"
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
          />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setCloseModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={isBusy} onClick={handleClose}>
            {isClosing ? 'Closing...' : 'Confirm Close'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
