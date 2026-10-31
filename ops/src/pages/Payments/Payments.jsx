import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetPaymentsQuery } from '../../services/endpoints/paymentApi';
import { Table, Button, Badge, Chip, FormField, Input } from '../../components';
import './Payments.css';

const METHOD_FILTERS = [
  { key: '', label: 'All Methods' },
  { key: 'bank_transfer', label: 'Bank Transfer' },
  { key: 'card', label: 'Card' },
  { key: 'cash', label: 'Cash' },
  { key: 'upi', label: 'UPI' },
  { key: 'cheque', label: 'Cheque' },
  { key: 'other', label: 'Other' },
];

export default function Payments() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useGetPaymentsQuery({
    page,
    limit: 10,
    method: selectedMethod || undefined,
    q: searchQuery.trim() || undefined,
  });

  const columns = [
    {
      key: 'paidOn',
      header: 'Payment Date',
      render: (row) => <strong>{row.paidOn}</strong>,
    },
    {
      key: 'invoice',
      header: 'Invoice #',
      render: (row) => (
        <div>
          <Link
            to={`/invoices/${row.invoice?.id}`}
            style={{ fontWeight: 600, color: 'var(--color-primary, #6366f1)', textDecoration: 'none' }}
          >
            {row.invoice?.number || `Invoice #${row.invoiceId}`}
          </Link>
          {row.invoice?.customer?.name && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {row.invoice.customer.name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => (
        <Badge variant="neutral" size="sm">
          {row.method ? row.method.toUpperCase().replace('_', ' ') : '—'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      align: 'right',
      render: (row) => (
        <strong style={{ color: 'var(--color-success, #16a34a)', fontSize: '0.95rem' }}>
          ${Number(row.amount || 0).toFixed(2)}
        </strong>
      ),
    },
    {
      key: 'recordedBy',
      header: 'Recorded By',
      render: (row) => (
        <span style={{ fontSize: '0.875rem' }}>
          {row.recorder?.name || row.recorder?.email || 'Staff'}
        </span>
      ),
    },
    {
      key: 'note',
      header: 'Memo / Reference',
      render: (row) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
          {row.note || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/invoices/${row.invoiceId}`)}
        >
          View Invoice
        </Button>
      ),
    },
  ];

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div className="payments-header__title">
          <h1>Payments Log</h1>
          <p>History of all manual and recorded payments across client accounts</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>

      <div className="payments-toolbar">
        <div className="payments-filters">
          {METHOD_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              active={selectedMethod === f.key}
              onClick={() => {
                setSelectedMethod(f.key);
                setPage(1);
              }}
            />
          ))}
        </div>

        <div className="payments-search">
          <FormField hideLabel label="Search">
            <Input
              placeholder="Search memo or invoice #..."
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
        emptyMessage="No payments found matching the selected method filter."
      />
    </div>
  );
}
