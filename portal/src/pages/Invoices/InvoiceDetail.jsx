import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetPortalInvoiceQuery } from '../../services/endpoints/portalApi';
import { Button, Badge, Card } from '../../components';
import './InvoiceDetail.css';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: invoice, isLoading, error } = useGetPortalInvoiceQuery(id);

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
        Loading invoice details...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--red)' }}>
        Invoice not found or access denied.
        <div style={{ marginTop: '1rem' }}>
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            Back to Invoices
          </Button>
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

  const handlePrint = () => {
    window.open(`/api/portal/invoices/${invoice.id}/print`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="portal-invdetail-page">
      <div className="portal-invdetail-nav">
        <Link to="/invoices">← Back to My Invoices</Link>
      </div>

      <div className="portal-invdetail-header">
        <div className="portal-invdetail-title">
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
            {invoice.status === 'confirmed' ? 'PENDING' : invoice.status.toUpperCase()}
          </Badge>
          {isOverdue && <Badge variant="danger">OVERDUE</Badge>}
        </div>

        <Button variant="primary" onClick={handlePrint}>
          🖨 Print / Download PDF
        </Button>
      </div>

      <div className="portal-invdetail-grid">
        <Card title="Invoice Information">
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Issue Date</span>
            <strong>{invoice.issueDate}</strong>
          </div>
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Due Date</span>
            <strong style={{ color: isOverdue ? 'var(--red, #b3261e)' : 'inherit' }}>
              {invoice.dueDate}
            </strong>
          </div>
          {invoice.periodStart && invoice.periodEnd && (
            <div className="portal-info-row">
              <span style={{ color: 'var(--muted)' }}>Billing Cycle</span>
              <strong>{invoice.periodStart} to {invoice.periodEnd}</strong>
            </div>
          )}
          {invoice.subscription && (
            <div className="portal-info-row">
              <span style={{ color: 'var(--muted)' }}>Subscription</span>
              <strong>
                <Link
                  to={`/subscriptions/${invoice.subscription.id}`}
                  style={{ color: 'var(--green, #1f7a4d)', textDecoration: 'none' }}
                >
                  {invoice.subscription.number}
                </Link>
              </strong>
            </div>
          )}
        </Card>

        <Card title="Billing Summary">
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Subtotal</span>
            <strong>${Number(invoice.subtotal).toFixed(2)}</strong>
          </div>
          {Number(invoice.discountTotal || 0) > 0 && (
            <div className="portal-info-row">
              <span style={{ color: 'var(--muted)' }}>Discount</span>
              <strong style={{ color: 'var(--red, #b3261e)' }}>
                -${Number(invoice.discountTotal).toFixed(2)}
              </strong>
            </div>
          )}
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Taxes</span>
            <strong>${Number(invoice.taxTotal).toFixed(2)}</strong>
          </div>
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Total Amount</span>
            <strong>${Number(invoice.total).toFixed(2)}</strong>
          </div>
          <div className="portal-info-row">
            <span style={{ color: 'var(--muted)' }}>Amount Paid</span>
            <strong style={{ color: 'var(--green, #1f7a4d)' }}>
              ${Number(invoice.amountPaid).toFixed(2)}
            </strong>
          </div>
          <div className="portal-info-row" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            <span>Balance Due</span>
            <span style={{ color: balanceDue > 0 ? 'var(--amber, #8a5a00)' : 'var(--green, #1f7a4d)' }}>
              ${balanceDue.toFixed(2)}
            </span>
          </div>
        </Card>
      </div>

      <Card title="Itemized Invoice Lines">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Variant</th>
              <th>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Tax</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lines || []).map((line) => (
              <tr key={line.id}>
                <td>
                  <strong>{line.product?.name || line.description}</strong>
                  {line.description && line.description !== line.product?.name && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                      {line.description}
                    </div>
                  )}
                </td>
                <td>{line.variant?.attributeValues || '—'}</td>
                <td>{line.qty}</td>
                <td style={{ textAlign: 'right' }}>${Number(line.unitPrice).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>
                  {Number(line.taxRate || 0) > 0 ? `${line.taxRate}%` : '0%'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ${Number(line.lineTotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {invoice.payments && invoice.payments.length > 0 && (
        <Card title="Payment History">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.paidOn}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {p.method?.replace('_', ' ')}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: 'var(--green, #1f7a4d)',
                    }}
                  >
                    ${Number(p.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
