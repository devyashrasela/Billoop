import React, { useState } from 'react';
import {
  useGetDiscountsQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
} from '../../services/endpoints/discountApi';
import { useGetProductsQuery } from '../../services/endpoints/productApi';
import {
  Table,
  Button,
  Badge,
  Modal,
  FormField,
  Input,
  Select,
} from '../../components';
import { DISCOUNT_TYPES, DISCOUNT_SCOPES } from '@brightloop/shared/constants';
import './Discounts.css';

const INITIAL_FORM = {
  name: '',
  code: '',
  type: 'percent',
  value: '',
  minPurchase: 0,
  minQty: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  usageLimit: '',
  scope: 'subscription',
  isActive: true,
  productIds: [],
};

export default function Discounts() {
  const [page, setPage] = useState(1);
  const [selectedScope, setSelectedScope] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data, isLoading } = useGetDiscountsQuery({
    page,
    limit: 10,
    scope: selectedScope || undefined,
  });

  const { data: productsData } = useGetProductsQuery({ limit: 100 });
  const allProducts = productsData?.data || [];

  const [createDiscount, { isLoading: isCreating }] = useCreateDiscountMutation();
  const [updateDiscount, { isLoading: isUpdating }] = useUpdateDiscountMutation();
  const [deleteDiscount] = useDeleteDiscountMutation();

  const handleOpenCreate = () => {
    setEditingDiscount(null);
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (disc) => {
    setEditingDiscount(disc);
    setFormData({
      name: disc.name,
      code: disc.code || '',
      type: disc.type,
      value: disc.value,
      minPurchase: disc.minPurchase || 0,
      minQty: disc.minQty || 0,
      startDate: disc.startDate,
      endDate: disc.endDate,
      usageLimit: disc.usageLimit !== null && disc.usageLimit !== undefined ? disc.usageLimit : '',
      scope: disc.scope,
      isActive: disc.isActive,
      productIds: disc.products ? disc.products.map((p) => p.id) : [],
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDiscount(null);
    setFieldErrors({});
  };

  const handleToggleProduct = (productId) => {
    const current = [...formData.productIds];
    const index = current.indexOf(productId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(productId);
    }
    setFormData({ ...formData, productIds: current });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const payload = {
      ...formData,
      code: formData.code.trim() ? formData.code.trim() : null,
      value: Number(formData.value) || 0,
      minPurchase: Number(formData.minPurchase) || 0,
      minQty: Number(formData.minQty) || 0,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      productIds: formData.scope === 'product' ? formData.productIds : [],
    };

    try {
      if (editingDiscount) {
        await updateDiscount({ id: editingDiscount.id, ...payload }).unwrap();
      } else {
        await createDiscount(payload).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      if (err?.data?.fieldErrors) {
        setFieldErrors(err.data.fieldErrors);
      } else {
        alert(err?.data?.message || 'Failed to save discount');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this discount promotion?')) {
      try {
        await deleteDiscount(id).unwrap();
      } catch (err) {
        alert(err?.data?.message || 'Failed to delete discount');
      }
    }
  };

  const columns = [
    {
      header: 'Discount Name',
      key: 'name',
      render: (disc) => (
        <div>
          <strong className="discount-name">{disc.name}</strong>
          {disc.code && <span className="discount-code">{disc.code}</span>}
        </div>
      ),
    },
    {
      header: 'Value',
      key: 'value',
      align: 'right',
      render: (disc) => (
        <span className="discount-value">
          {disc.type === 'percent' ? `${disc.value}% off` : `-₹${Number(disc.value).toFixed(2)}`}
        </span>
      ),
    },
    {
      header: 'Scope',
      key: 'scope',
      render: (disc) => (
        <span className="scope-pill">
          {disc.scope === 'product' ? 'Product lines' : 'Entire subscription'}
        </span>
      ),
    },
    {
      header: 'Validity Period',
      key: 'period',
      render: (disc) => (
        <span className="discount-dates">
          {disc.startDate} → {disc.endDate}
        </span>
      ),
    },
    {
      header: 'Usage',
      key: 'usedCount',
      align: 'right',
      render: (disc) => (
        <span>
          {disc.usedCount} / {disc.usageLimit !== null ? disc.usageLimit : '∞'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (disc) => (
        <Badge status={disc.isActive ? 'active' : 'draft'}>
          {disc.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (disc) => (
        <div className="discount-actions">
          <Button size="sm" onClick={() => handleOpenEdit(disc)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(disc.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="discounts-page">
      <div className="discounts-page__head">
        <div>
          <h1>Discounts & Coupons</h1>
          <p>Configure percentage or fixed deductions applicable to products or subscriptions.</p>
        </div>
        <div className="discounts-page__filters">
          <Select
            value={selectedScope}
            onChange={(e) => {
              setSelectedScope(e.target.value);
              setPage(1);
            }}
            className="scope-filter"
          >
            <option value="">All Scopes</option>
            {DISCOUNT_SCOPES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={handleOpenCreate}>
            + New Discount
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
        emptyMessage="No discounts match criteria."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="580px"
        title={editingDiscount ? 'Edit Discount Rule' : 'Create Discount Rule'}
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
              {isCreating || isUpdating ? 'Saving…' : 'Save Discount'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="discount-form">
          <div className="discount-form__row">
            <FormField label="Discount Name" required error={fieldErrors.name}>
              <Input
                value={formData.name}
                placeholder="e.g. New Year Special, Early Bird"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Coupon Code" helperText="Optional" error={fieldErrors.code}>
              <Input
                value={formData.code}
                placeholder="e.g. SAVE20"
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </FormField>
          </div>

          <div className="discount-form__row">
            <FormField label="Discount Type" required error={fieldErrors.type}>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {DISCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'percent' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label={formData.type === 'percent' ? 'Percentage Value (%)' : 'Amount Value (₹)'}
              required
              error={fieldErrors.value}
            >
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.value}
                placeholder={formData.type === 'percent' ? '15.00' : '500.00'}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </FormField>
          </div>

          <div className="discount-form__row">
            <FormField label="Application Scope" required error={fieldErrors.scope}>
              <Select
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              >
                <option value="subscription">Entire Subscription Subtotal</option>
                <option value="product">Specific Product Lines Only</option>
              </Select>
            </FormField>

            <FormField label="Usage Limit" helperText="Leave blank for unlimited" error={fieldErrors.usageLimit}>
              <Input
                type="number"
                min="1"
                value={formData.usageLimit}
                placeholder="e.g. 100"
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              />
            </FormField>
          </div>

          {formData.scope === 'product' && (
            <div className="product-selection-box">
              <span className="selection-title">Select Eligible Products:</span>
              <div className="product-checkboxes">
                {allProducts.map((p) => {
                  const isChecked = formData.productIds.includes(p.id);
                  return (
                    <label key={p.id} className="product-check-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleProduct(p.id)}
                      />
                      <span>{p.name} (₹{Number(p.salesPrice).toFixed(2)})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="discount-form__row">
            <FormField label="Valid From" required error={fieldErrors.startDate}>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </FormField>

            <FormField label="Valid Until" required error={fieldErrors.endDate}>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </FormField>
          </div>

          <div className="discount-form__row">
            <FormField label="Minimum Purchase (₹)" error={fieldErrors.minPurchase}>
              <Input
                type="number"
                min="0"
                value={formData.minPurchase}
                placeholder="0"
                onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
              />
            </FormField>

            <FormField label="Minimum Quantity" error={fieldErrors.minQty}>
              <Input
                type="number"
                min="0"
                value={formData.minQty}
                placeholder="0"
                onChange={(e) => setFormData({ ...formData, minQty: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Status">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Active and automatically claimable on invoices</span>
            </label>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
