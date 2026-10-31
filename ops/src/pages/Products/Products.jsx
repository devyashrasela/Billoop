import React, { useState } from 'react';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../services/endpoints/productApi';
import {
  Table,
  Button,
  Badge,
  Modal,
  FormField,
  Input,
  Select,
} from '../../components';
import { PRODUCT_TYPES } from '@brightloop/shared/constants';
import './Products.css';

const INITIAL_FORM = {
  name: '',
  type: 'service',
  salesPrice: '',
  costPrice: '',
  notes: '',
  isActive: true,
  variants: [],
};

export default function Products() {
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  // Dynamic new variant inputs
  const [newAttr, setNewAttr] = useState('');
  const [newVal, setNewVal] = useState('');
  const [newExtra, setNewExtra] = useState('');

  const { data, isLoading } = useGetProductsQuery({
    page,
    limit: 10,
    type: selectedType || undefined,
  });

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      type: prod.type,
      salesPrice: prod.salesPrice,
      costPrice: prod.costPrice,
      notes: prod.notes || '',
      isActive: prod.isActive,
      variants: prod.variants ? prod.variants.map((v) => ({ ...v })) : [],
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFieldErrors({});
    setNewAttr('');
    setNewVal('');
    setNewExtra('');
  };

  const handleAddVariantRow = () => {
    if (!newAttr.trim() || !newVal.trim()) {
      alert('Attribute name and value are required (e.g. Brand: Odoo)');
      return;
    }
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          attribute: newAttr.trim(),
          value: newVal.trim(),
          extraPrice: Number(newExtra) || 0,
        },
      ],
    });
    setNewAttr('');
    setNewVal('');
    setNewExtra('');
  };

  const handleRemoveVariantRow = (index) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, idx) => idx !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const payload = {
      ...formData,
      salesPrice: Number(formData.salesPrice) || 0,
      costPrice: Number(formData.costPrice) || 0,
      variants: formData.variants.map((v) => ({
        attribute: v.attribute,
        value: v.value,
        extraPrice: Number(v.extraPrice) || 0,
      })),
    };

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, ...payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      if (err?.data?.fieldErrors) {
        setFieldErrors(err.data.fieldErrors);
      } else {
        alert(err?.data?.message || 'Failed to save product');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product? It will be archived from catalog.')) {
      try {
        await deleteProduct(id).unwrap();
      } catch (err) {
        alert(err?.data?.message || 'Failed to delete product');
      }
    }
  };

  const columns = [
    {
      header: 'Product Name',
      key: 'name',
      render: (prod) => (
        <div>
          <strong className="product-name">{prod.name}</strong>
          {prod.variants && prod.variants.length > 0 && (
            <div className="product-variants-tags">
              {prod.variants.map((v) => (
                <span key={v.id || `${v.attribute}-${v.value}`} className="variant-tag">
                  {v.attribute}: {v.value} (+₹{Number(v.extraPrice).toFixed(2)})
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      render: (prod) => (
        <span className="product-type">{prod.type.toUpperCase()}</span>
      ),
    },
    {
      header: 'Sales Price',
      key: 'salesPrice',
      align: 'right',
      render: (prod) => `₹${Number(prod.salesPrice).toFixed(2)}`,
    },
    {
      header: 'Cost Price',
      key: 'costPrice',
      align: 'right',
      render: (prod) => `₹${Number(prod.costPrice).toFixed(2)}`,
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (prod) => (
        <Badge status={prod.isActive ? 'active' : 'draft'}>
          {prod.isActive ? 'Active' : 'Archived'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (prod) => (
        <div className="product-actions">
          <Button size="sm" onClick={() => handleOpenEdit(prod)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(prod.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="products-page">
      <div className="products-page__head">
        <div>
          <h1>Products & Variants</h1>
          <p>Manage subscription products, recurring add-ons, and pricing variants.</p>
        </div>
        <div className="products-page__filters">
          <Select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="type-filter"
          >
            <option value="">All Types</option>
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={handleOpenCreate}>
            + New Product
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
        emptyMessage="No products match the selected criteria."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="540px"
        title={editingProduct ? 'Edit Product' : 'Create Product'}
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
              {isCreating || isUpdating ? 'Saving…' : 'Save Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="product-form">
          <FormField label="Product Name" required error={fieldErrors.name}>
            <Input
              value={formData.name}
              placeholder="e.g. Pro SaaS License, Managed Backup"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <div className="product-form__row">
            <FormField label="Product Type" required error={fieldErrors.type}>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Sales Price (₹)" required error={fieldErrors.salesPrice}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.salesPrice}
                placeholder="2000.00"
                onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
              />
            </FormField>
          </div>

          <div className="product-form__row">
            <FormField label="Cost Price (₹)" error={fieldErrors.costPrice}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                placeholder="500.00"
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              />
            </FormField>

            <FormField label="Internal Notes">
              <Input
                value={formData.notes}
                placeholder="Optional catalog notes"
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </FormField>
          </div>

          <div className="product-form__variants-section">
            <h3 className="variants-heading">Product Variants (e.g. Brand: Odoo, Edition)</h3>

            {formData.variants.length > 0 && (
              <div className="variants-list">
                {formData.variants.map((v, idx) => (
                  <div key={idx} className="variant-row">
                    <span className="variant-label">
                      <strong>{v.attribute}:</strong> {v.value} (+₹{Number(v.extraPrice).toFixed(2)})
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveVariantRow(idx)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="variant-inputs">
              <Input
                placeholder="Attribute (e.g. Brand)"
                value={newAttr}
                onChange={(e) => setNewAttr(e.target.value)}
              />
              <Input
                placeholder="Value (e.g. Odoo)"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Extra ₹ (560)"
                value={newExtra}
                onChange={(e) => setNewExtra(e.target.value)}
              />
              <Button size="sm" onClick={handleAddVariantRow}>
                + Add
              </Button>
            </div>
          </div>

          <FormField label="Status">
            <label className="product-form__checkbox">
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
