import React, { useState } from 'react';
import {
  useGetPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} from '../../services/endpoints/planApi';
import {
  Table,
  Button,
  Badge,
  Modal,
  FormField,
  Input,
  Select,
} from '../../components';
import { BILLING_PERIODS } from '@brightloop/shared/constants';
import './Plans.css';

const INITIAL_FORM = {
  name: '',
  price: '',
  billingPeriod: 'monthly',
  minQty: 1,
  availableFrom: '',
  availableTo: '',
  autoClose: false,
  allowEarlyClose: true,
  allowPause: false,
  allowRenew: true,
  isActive: true,
};

export default function Plans() {
  const [page, setPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data, isLoading } = useGetPlansQuery({
    page,
    limit: 10,
    billingPeriod: selectedPeriod || undefined,
  });

  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      minQty: plan.minQty,
      availableFrom: plan.availableFrom || '',
      availableTo: plan.availableTo || '',
      autoClose: plan.autoClose,
      allowEarlyClose: plan.allowEarlyClose,
      allowPause: plan.allowPause,
      allowRenew: plan.allowRenew,
      isActive: plan.isActive,
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const payload = {
      ...formData,
      price: Number(formData.price) || 0,
      minQty: Number(formData.minQty) || 1,
      availableFrom: formData.availableFrom || null,
      availableTo: formData.availableTo || null,
    };

    try {
      if (editingPlan) {
        await updatePlan({ id: editingPlan.id, ...payload }).unwrap();
      } else {
        await createPlan(payload).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      if (err?.data?.fieldErrors) {
        setFieldErrors(err.data.fieldErrors);
      } else {
        alert(err?.data?.message || 'Failed to save plan');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this subscription plan? It will be archived.')) {
      try {
        await deletePlan(id).unwrap();
      } catch (err) {
        alert(err?.data?.message || 'Failed to delete plan');
      }
    }
  };

  const columns = [
    {
      header: 'Plan Name',
      key: 'name',
      render: (plan) => (
        <div>
          <strong className="plan-name">{plan.name}</strong>
          <div className="plan-rules-meta">
            {plan.allowPause && <span className="meta-pill">Pauseable</span>}
            {plan.allowRenew && <span className="meta-pill">Renewable</span>}
            {plan.autoClose && <span className="meta-pill meta-pill--alert">Auto-close</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Billing Cycle',
      key: 'billingPeriod',
      render: (plan) => (
        <span className="plan-period">
          {plan.billingPeriod.charAt(0).toUpperCase() + plan.billingPeriod.slice(1)}
        </span>
      ),
    },
    {
      header: 'Price',
      key: 'price',
      align: 'right',
      render: (plan) => `₹${Number(plan.price).toFixed(2)} / ${plan.billingPeriod}`,
    },
    {
      header: 'Min Qty',
      key: 'minQty',
      align: 'right',
      render: (plan) => plan.minQty,
    },
    {
      header: 'Availability',
      key: 'availability',
      render: (plan) => (
        <span className="plan-dates">
          {plan.availableFrom || plan.availableTo
            ? `${plan.availableFrom || 'Start'} → ${plan.availableTo || 'Indefinite'}`
            : 'Always available'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (plan) => (
        <Badge status={plan.isActive ? 'active' : 'draft'}>
          {plan.isActive ? 'Active' : 'Archived'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (plan) => (
        <div className="plan-actions">
          <Button size="sm" onClick={() => handleOpenEdit(plan)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(plan.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="plans-page">
      <div className="plans-page__head">
        <div>
          <h1>Subscription Plans</h1>
          <p>Define recurring billing cycles, prices, and automated lifecycle permissions.</p>
        </div>
        <div className="plans-page__filters">
          <Select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setPage(1);
            }}
            className="period-filter"
          >
            <option value="">All Cycles</option>
            {BILLING_PERIODS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={handleOpenCreate}>
            + New Plan
          </Button>
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
        emptyMessage="No subscription plans match criteria."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="560px"
        title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        footer={
          <>
            <Button size="sm" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={isCreating || isUpdating}
              onClick={handleSubmit}
            >
              {isCreating || isUpdating ? 'Saving…' : 'Save Plan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="plan-form">
          <FormField label="Plan Name" required error={fieldErrors.name}>
            <Input
              value={formData.name}
              placeholder="e.g. Standard Monthly, Growth Yearly"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <div className="plan-form__row">
            <FormField label="Recurring Price (₹)" required error={fieldErrors.price}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                placeholder="2000.00"
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </FormField>

            <FormField label="Billing Cycle" required error={fieldErrors.billingPeriod}>
              <Select
                value={formData.billingPeriod}
                onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
              >
                {BILLING_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="plan-form__row">
            <FormField label="Minimum Quantity" required error={fieldErrors.minQty}>
              <Input
                type="number"
                min="1"
                value={formData.minQty}
                onChange={(e) => setFormData({ ...formData, minQty: e.target.value })}
              />
            </FormField>
          </div>

          <div className="plan-form__row">
            <FormField label="Available From" helperText="YYYY-MM-DD" error={fieldErrors.availableFrom}>
              <Input
                type="date"
                value={formData.availableFrom}
                onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
              />
            </FormField>

            <FormField label="Available To" helperText="YYYY-MM-DD" error={fieldErrors.availableTo}>
              <Input
                type="date"
                value={formData.availableTo}
                onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
              />
            </FormField>
          </div>

          <div className="plan-rules-box">
            <span className="rules-box-title">Lifecycle & Customer Self-Service Rules</span>
            <div className="rules-grid">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.allowPause}
                  onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                />
                <span>Allow Pause</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.allowRenew}
                  onChange={(e) => setFormData({ ...formData, allowRenew: e.target.checked })}
                />
                <span>Allow Renew</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.allowEarlyClose}
                  onChange={(e) => setFormData({ ...formData, allowEarlyClose: e.target.checked })}
                />
                <span>Allow Early Close</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.autoClose}
                  onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                />
                <span>Auto-Close on Expiry</span>
              </label>
            </div>
          </div>

          <FormField label="Status">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Active in catalog</span>
            </label>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
