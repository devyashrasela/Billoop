import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetInvoicesQuery } from '../../services/endpoints/invoiceApi';
import {
  Table,
  Button,
  Badge,
  Chip,
  FormField,
  Input,
  RecordPaymentModal,
} from '../../components';
import './Invoices.css';

const STATUS_FILTERS = [
  { key: '', label: 'All Invoices' },
  { key: 'draft', label: 'Draft' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function Invoices() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  const { data, isLoading } = useGetInvoicesQuery({
    page,
    limit: 10,
    status: selectedStatus || undefined,
    q: searchQuery.trim() || undefined,
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const getStatusBadge = (inv) => {
    const isOverdue =
      inv.status === 'confirmed' &&
      Number(inv.amountPaid) < Number(inv.total) &&
      inv.dueDate < todayStr;

    if (isOverdue) {
      return (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <Badge variant="warning" size="sm">CONFIRMED</Badge>
          <Badge variant="danger" size="sm">OVERDUE</Badge>
        </div>
      );
    }

    switch (inv.status) {
      case 'paid':
        return <Badge variant="success" size="sm">PAID</Badge>;
      case 'confirmed':
        return <Badge variant="warning" size="sm">CONFIRMED</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">CANCELLED</Badge>;
      case 'draft':
      default:
        return <Badge variant="neutral" size="sm">DRAFT</Badge>;
    }
  };

  const columns = [
    {
      key: 'number',
      header: 'Invoice #',
      render: (row) => (
        <Link to={`/invoices/${row.id}`} className="inv-num-link">
          {row.number}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div className="inv-customer-cell">
          <span className="inv-customer-name">{row.customer?.name || '—'}</span>
          {row.customer?.company && (
            <span className="inv-customer-company">{row.customer.company}</span>
          )}
        </div>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue / Due Date',
      render: (row) => (
        <div>
          <div>{row.issueDate}</div>
          <small style={{ color: 'var(--color-text-muted, #94a3b8)' }}>
            Due: {row.dueDate}
          </small>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Amount / Paid',
      align: 'right',
      render: (row) => {
        const total = Number(row.total || 0);
        const paid = Number(row.amountPaid || 0);
        const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
        return (
          <div style={{ minWidth: '110px' }}>
            <div style={{ fontWeight: 600 }}>${total.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Paid: ${paid.toFixed(2)}
            </div>
            {total > 0 && paid > 0 && paid < total && (
              <div className="inv-progress-bar">
                <div className="inv-progress-fill" style={{ width: `${percent}%` }} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => getStatusBadge(row),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const canPay =
          row.status === 'confirmed' && Number(row.amountPaid || 0) < Number(row.total || 0);

        return (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {canPay && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPaymentModalInvoice(row)}
              >
                Pay
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/invoices/${row.id}`)}
            >
              View
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="invoices-page">
      <div className="invoices-header">
        <div className="invoices-header__title">
          <h1>Invoices</h1>
          <p>Track recurring billing invoices, overdue balances, and payments</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/payments')}>
          View Payment Log
        </Button>
      </div>

      <div className="invoices-toolbar">
        <div className="invoices-filters">
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              active={selectedStatus === f.key}
              onClick={() => {
                setSelectedStatus(f.key);
                setPage(1);
              }}
            />
          ))}
        </div>

        <div className="invoices-search">
          <FormField hideLabel label="Search">
            <Input
              placeholder="Search by # or customer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </FormField>
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.meta?.totalPages || 1}
        totalRecords={data?.meta?.total}
        onPageChange={setPage}
        emptyMessage="No invoices found matching the current criteria."
      />

      <RecordPaymentModal
        isOpen={Boolean(paymentModalInvoice)}
        onClose={() => setPaymentModalInvoice(null)}
        invoice={paymentModalInvoice}
      />
    </div>
  );
}
