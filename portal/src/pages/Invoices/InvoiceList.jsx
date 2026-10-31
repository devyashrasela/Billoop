import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGetPortalInvoicesQuery } from '../../services/endpoints/portalApi';
import { Table, Button, Badge, Chip } from '../../components';
import './InvoiceList.css';

const STATUS_FILTERS = [
  { key: '', label: 'All Invoices' },
  { key: 'confirmed', label: 'Unpaid / Pending' },
  { key: 'paid', label: 'Paid' },
];

export default function InvoiceList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data, isLoading } = useGetPortalInvoicesQuery({
    page,
    limit: 10,
    status: selectedStatus || undefined,
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
          <Badge variant="warning" size="sm">PENDING</Badge>
          <Badge variant="danger" size="sm">OVERDUE</Badge>
        </div>
      );
    }

    switch (inv.status) {
      case 'paid':
        return <Badge variant="success" size="sm">PAID</Badge>;
      case 'confirmed':
        return <Badge variant="warning" size="sm">PENDING</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{inv.status.toUpperCase()}</Badge>;
    }
  };

  const handlePrint = (e, invId) => {
    e.stopPropagation();
    window.open(`/api/portal/invoices/${invId}/print`, '_blank', 'noopener,noreferrer');
  };

  const columns = [
    {
      key: 'number',
      header: 'Invoice #',
      render: (row) => (
        <Link
          to={`/invoices/${row.id}`}
          style={{ fontWeight: 600, color: 'var(--green, #1f7a4d)', textDecoration: 'none' }}
        >
          {row.number}
        </Link>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      render: (row) => row.issueDate,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row) => {
        const isLate = row.status === 'confirmed' && row.dueDate < todayStr;
        return (
          <span style={{ color: isLate ? 'var(--red, #b3261e)' : 'inherit', fontWeight: isLate ? 600 : 'normal' }}>
            {row.dueDate}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Total Amount',
      align: 'right',
      render: (row) => <strong>${Number(row.total || 0).toFixed(2)}</strong>,
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
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => handlePrint(e, row.id)}
          >
            🖨 Print / PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/invoices/${row.id}`)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="portal-inv-page">
      <div className="portal-inv-header">
        <div>
          <h1>My Invoices</h1>
          <p>Review payment records, statement history, and download tax invoices</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

      <Table
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.meta?.totalPages || 1}
        totalRecords={data?.meta?.total}
        onPageChange={setPage}
        emptyMessage="No invoices found."
      />
    </div>
  );
}
