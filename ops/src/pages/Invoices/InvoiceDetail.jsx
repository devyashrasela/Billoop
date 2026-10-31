import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetInvoiceQuery,
  useConfirmInvoiceMutation,
  useCancelInvoiceMutation,
} from '../../services/endpoints/invoiceApi';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormField,
  Input,
  RecordPaymentModal,
} from '../../components';
import './InvoiceDetail.css';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: invoice, isLoading, error } = useGetInvoiceQuery(id);
  const [confirmInvoice, { isLoading: isConfirming }] = useConfirmInvoiceMutation();
  const [cancelInvoice, { isLoading: isCancelling }] = useCancelInvoiceMutation();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState('');

  if (isLoading) {
    return (
      <div className="inv-detail-page">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading invoice details...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="inv-detail-page">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger, #ef4444)' }}>
          Invoice not found or error loading record.
          <div style={{ marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => navigate('/invoices')}>
              Back to Invoices
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue =
    invoice.status === 'confirmed' &&
    Number(invoice.amountPaid) < Number(invoice.total) &&
    invoice.dueDate < todayStr;

  const total = Number(invoice.total || 0);
  const amountPaid = Number(invoice.amountPaid || 0);
  const balanceDue = Math.max(0, total - amountPaid);

  const canPay = invoice.status === 'confirmed' && balanceDue > 0;
  const canConfirm = invoice.status === 'draft';
  const canCancel = invoice.status !== 'cancelled' && amountPaid === 0;

  const handleConfirm = async () => {
    setActionError('');
    try {
      await confirmInvoice(invoice.id).unwrap();
    } catch (err) {
      setActionError(err.data?.message || 'Failed to confirm invoice');
    }
  };

  const handleCancel = async () => {
    setActionError('');
    try {
      await cancelInvoice({ id: invoice.id, reason: cancelReason || 'Cancelled by staff' }).unwrap();
      setCancelModalOpen(false);
    } catch (err) {
      setActionError(err.data?.message || 'Failed to cancel invoice');
    }
  };

  const handlePrint = () => {
    const printUrl = `/api/ops/invoices/${invoice.id}/print`;
    window.open(printUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="inv-detail-page">
      <div className="inv-detail-nav">
        <Link to="/invoices" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          ← Back to Invoices
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

      <div className="inv-detail-header">
        <div className="inv-detail-title">
          <h1>{invoice.number}</h1>
          <Badge
            variant={
              invoice.status === 'paid'
                ? 'success'
                : invoice.status === 'cancelled'
                ? 'danger'
                : invoice.status === 'confirmed'
                ? 'warning'
                : 'neutral'
            }
          >
            {invoice.status.toUpperCase()}
          </Badge>
          {isOverdue && <Badge variant="danger">OVERDUE</Badge>}
        </div>

        <div className="inv-detail-actions">
          <Button variant="secondary" onClick={handlePrint}>
            🖨 Print / PDF
          </Button>

          {canPay && (
            <Button variant="primary" onClick={() => setPaymentModalOpen(true)}>
              Record Payment
            </Button>
          )}

          {canConfirm && (
            <Button
              variant="primary"
              disabled={isConfirming}
              onClick={handleConfirm}
            >
              {isConfirming ? 'Confirming...' : 'Confirm Invoice'}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="danger"
              disabled={isCancelling}
              onClick={() => setCancelModalOpen(true)}
            >
              Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Grid of info cards */}
      <div className="inv-detail-grid">
        <Card title="Customer Information">
          <div className="inv-info-list">
            <div className="inv-info-row">
              <span className="inv-info-label">Customer Name</span>
              <span className="inv-info-val">{invoice.customer?.name}</span>
            </div>
            <div className="inv-info-row">
              <span className="inv-info-label">Company</span>
              <span className="inv-info-val">{invoice.customer?.company || '—'}</span>
            </div>
            <div className="inv-info-row">
              <span className="inv-info-label">Phone</span>
              <span className="inv-info-val">{invoice.customer?.phone || '—'}</span>
            </div>
            <div className="inv-info-row">
              <span className="inv-info-label">Address</span>
              <span className="inv-info-val">
                {[invoice.customer?.addressLine1, invoice.customer?.city, invoice.customer?.country]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Invoice Information">
          <div className="inv-info-list">
            <div className="inv-info-row">
              <span className="inv-info-label">Issue Date</span>
              <span className="inv-info-val">{invoice.issueDate}</span>
            </div>
            <div className="inv-info-row">
              <span className="inv-info-label">Due Date</span>
              <span className="inv-info-val" style={{ color: isOverdue ? 'var(--color-danger, #ef4444)' : 'inherit' }}>
                {invoice.dueDate}
              </span>
            </div>
            {invoice.periodStart && invoice.periodEnd && (
              <div className="inv-info-row">
                <span className="inv-info-label">Billing Cycle</span>
                <span className="inv-info-val">
                  {invoice.periodStart} to {invoice.periodEnd}
                </span>
              </div>
            )}
            {invoice.subscription && (
              <div className="inv-info-row">
                <span className="inv-info-label">Subscription Ref</span>
                <span className="inv-info-val">
                  <Link
                    to={`/subscriptions/${invoice.subscription.id}`}
                    style={{ color: 'var(--color-primary, #6366f1)', textDecoration: 'none' }}
                  >
                    {invoice.subscription.number}
                  </Link>
                </span>
              </div>
            )}
            {invoice.cancelledAt && (
              <div className="inv-info-row">
                <span className="inv-info-label">Cancelled At</span>
                <span className="inv-info-val" style={{ color: 'var(--color-danger, #ef4444)' }}>
                  {new Date(invoice.cancelledAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Frozen Snapshot Lines Table */}
      <Card title="Itemized Invoice Lines" className="inv-lines-card">
        <table className="inv-lines-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Variant</th>
              <th>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Discount</th>
              <th style={{ textAlign: 'right' }}>Tax</th>
              <th style={{ textAlign: 'right' }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lines || []).map((line) => (
              <tr key={line.id}>
                <td>
                  <strong>{line.product?.name || line.description}</strong>
                  {line.description && line.description !== line.product?.name && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {line.description}
                    </div>
                  )}
                </td>
                <td>{line.variant?.attributeValues || '—'}</td>
                <td>{line.qty}</td>
                <td style={{ textAlign: 'right' }}>${Number(line.unitPrice).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>
                  {Number(line.discountAmount || 0) > 0 ? (
                    <span style={{ color: 'var(--color-danger, #ef4444)' }}>
                      -${Number(line.discountAmount).toFixed(2)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {Number(line.taxRate || 0) > 0 ? `${line.taxRate}%` : '0%'}
                  {Number(line.taxAmount || 0) > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      (${Number(line.taxAmount).toFixed(2)})
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ${Number(line.lineTotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-totals-box">
          <div className="inv-totals-inner">
            <div className="inv-info-row">
              <span className="inv-info-label">Subtotal</span>
              <span className="inv-info-val">${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.discountTotal || 0) > 0 && (
              <div className="inv-info-row">
                <span className="inv-info-label">Discounts</span>
                <span className="inv-info-val" style={{ color: 'var(--color-danger, #ef4444)' }}>
                  -${Number(invoice.discountTotal).toFixed(2)}
                </span>
              </div>
            )}
            <div className="inv-info-row">
              <span className="inv-info-label">Taxes</span>
              <span className="inv-info-val">${Number(invoice.taxTotal).toFixed(2)}</span>
            </div>
            <div className="inv-info-row" style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>
              <span>Total</span>
              <span>${Number(invoice.total).toFixed(2)}</span>
            </div>
            <div className="inv-info-row">
              <span className="inv-info-label">Amount Paid</span>
              <span className="inv-info-val" style={{ color: 'var(--color-success, #16a34a)' }}>
                ${Number(invoice.amountPaid).toFixed(2)}
              </span>
            </div>
            <div
              className="inv-info-row"
              style={{
                fontSize: '1.15rem',
                fontWeight: 'bold',
                color: balanceDue > 0 ? 'var(--color-primary, #6366f1)' : 'var(--color-success, #16a34a)',
              }}
            >
              <span>Balance Due</span>
              <span>${balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment History Card */}
      <Card title="Payment History" className="inv-payments-card">
        {(!invoice.payments || invoice.payments.length === 0) ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No payments have been recorded for this invoice yet.
          </div>
        ) : (
          <table className="inv-lines-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Note / Memo</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.paidOn}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {p.method?.replace('_', ' ')}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{p.note || '—'}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: 'var(--color-success, #16a34a)',
                    }}
                  >
                    ${Number(p.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Invoice"
      >
        <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          Are you sure you want to cancel invoice <strong>{invoice.number}</strong>?
        </div>
        <FormField label="Reason for cancellation">
          <Input
            placeholder="e.g. Generated in error, customer credit applied"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
            Close
          </Button>
          <Button variant="danger" disabled={isCancelling} onClick={handleCancel}>
            {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={invoice}
      />
    </div>
  );
}
