import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetSubscriptionsQuery } from '../../services/endpoints/subscriptionApi';
import { Table, Button, Badge, Chip, FormField, Input } from '../../components';
import './Subscriptions.css';

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'quotation', label: 'Quotation' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
];

export default function Subscriptions() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useGetSubscriptionsQuery({
    page,
    limit: 10,
    status: selectedStatus || undefined,
    q: searchQuery.trim() || undefined,
  });

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'confirmed':
        return 'warning';
      case 'quotation':
        return 'info';
      case 'closed':
        return 'danger';
      case 'draft':
      default:
        return 'neutral';
    }
  };

  const columns = [
    {
      key: 'number',
      header: 'Subscription #',
      render: (row) => (
        <Link to={`/subscriptions/${row.id}`} className="sub-num-link">
          {row.number}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div className="sub-customer-cell">
          <span className="sub-customer-name">{row.customer?.name || '—'}</span>
          {row.customer?.company && (
            <span className="sub-customer-company">{row.customer.company}</span>
          )}
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan / Frequency',
      render: (row) => (
        <div>
          <div>{row.plan?.name || '—'}</div>
          <small style={{ color: 'var(--color-text-muted, #94a3b8)', textTransform: 'capitalize' }}>
            {row.plan?.billingPeriod || ''}
          </small>
        </div>
      ),
    },
    {
      key: 'recurringTotal',
      header: 'Amount',
      align: 'right',
      render: (row) => <strong>${Number(row.recurringTotal || 0).toFixed(2)}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <Badge variant={getStatusVariant(row.status)} size="sm">
            {row.status.toUpperCase()}
          </Badge>
          {row.isPaused && (
            <Badge variant="warning" size="sm">
              PAUSED
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'nextBillingDate',
      header: 'Next Billing',
      render: (row) => row.nextBillingDate || '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/subscriptions/${row.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="subscriptions-page">
      <div className="subscriptions-header">
        <div className="subscriptions-header__title">
          <h1>Subscriptions</h1>
          <p>Manage customer recurring contracts, quotations, and active renewals</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/subscriptions/new')}>
          + New Subscription
        </Button>
      </div>

      <div className="subscriptions-toolbar">
        <div className="subscriptions-filters">
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              active={selectedStatus === f.key}
              onClick={() => {
                setSelectedStatus(f.key);
                setPage(1);
              }}
            >
              {f.label}
            </Chip>
          ))}
        </div>

        <div className="subscriptions-search">
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
        emptyMessage="No subscriptions found matching the filter."
      />
    </div>
  );
}
