import React, { useState } from 'react';
import {
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} from '../../services/endpoints/templateApi';
import { useGetPlansQuery } from '../../services/endpoints/planApi';
import { useGetProductsQuery } from '../../services/endpoints/productApi';
import { useGetPaymentTermsQuery } from '../../services/endpoints/paymentTermApi';
import { useGetTaxesQuery } from '../../services/endpoints/taxApi';
import {
  Table,
  Button,
  Badge,
  Modal,
  FormField,
  Input,
  Select,
} from '../../components';
import './Templates.css';

const INITIAL_FORM = {
  name: '',
  planId: '',
  validityDays: 30,
  paymentTermId: '',
  isActive: true,
  lines: [],
};

export default function Templates() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  // Line item picker states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [lineQty, setLineQty] = useState(1);
  const [linePrice, setLinePrice] = useState('');
  const [selectedTax, setSelectedTax] = useState('');

  const { data, isLoading } = useGetTemplatesQuery({ page, limit: 10 });
  const { data: plansData } = useGetPlansQuery({ limit: 100 });
  const { data: productsData } = useGetProductsQuery({ limit: 100 });
  const { data: termsData } = useGetPaymentTermsQuery({ limit: 100 });
  const { data: taxesData } = useGetTaxesQuery({ limit: 100 });

  const allPlans = plansData?.data || [];
  const allProducts = productsData?.data || [];
  const allTerms = termsData?.data || [];
  const allTaxes = taxesData?.data || [];

  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();
  const [deleteTemplate] = useDeleteTemplateMutation();

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      ...INITIAL_FORM,
      planId: allPlans[0]?.id || '',
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setFormData({
      name: tmpl.name,
      planId: tmpl.planId,
      validityDays: tmpl.validityDays,
      paymentTermId: tmpl.paymentTermId || '',
      isActive: tmpl.isActive,
      lines: tmpl.lines
        ? tmpl.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId || null,
            qty: l.qty,
            unitPrice: l.unitPrice !== null ? l.unitPrice : '',
            taxId: l.taxId || null,
          }))
        : [],
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setFieldErrors({});
    resetLineDraft();
  };

  const resetLineDraft = () => {
    setSelectedProduct('');
    setSelectedVariant('');
    setLineQty(1);
    setLinePrice('');
    setSelectedTax('');
  };

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    setSelectedVariant('');
    const prod = allProducts.find((p) => p.id === Number(productId));
    if (prod) {
      setLinePrice(prod.salesPrice);
    }
  };

  const handleVariantSelect = (variantId) => {
    setSelectedVariant(variantId);
    const prod = allProducts.find((p) => p.id === Number(selectedProduct));
    if (prod && variantId) {
      const v = prod.variants?.find((varItem) => varItem.id === Number(variantId));
      if (v) {
        setLinePrice(Number(prod.salesPrice) + Number(v.extraPrice));
      }
    }
  };

  const handleAddLine = () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          productId: Number(selectedProduct),
          variantId: selectedVariant ? Number(selectedVariant) : null,
          qty: Number(lineQty) || 1,
          unitPrice: linePrice !== '' ? Number(linePrice) : null,
          taxId: selectedTax ? Number(selectedTax) : null,
        },
      ],
    });

    resetLineDraft();
  };

  const handleRemoveLine = (idx) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (formData.lines.length === 0) {
      alert('A quotation template requires at least one product line item.');
      return;
    }

    const payload = {
      ...formData,
      planId: Number(formData.planId),
      validityDays: Number(formData.validityDays) || 30,
      paymentTermId: formData.paymentTermId ? Number(formData.paymentTermId) : null,
      lines: formData.lines.map((l) => ({
        productId: Number(l.productId),
        variantId: l.variantId ? Number(l.variantId) : null,
        qty: Number(l.qty),
        unitPrice: l.unitPrice !== '' && l.unitPrice !== null ? Number(l.unitPrice) : null,
        taxId: l.taxId ? Number(l.taxId) : null,
      })),
    };

    try {
      if (editingTemplate) {
        await updateTemplate({ id: editingTemplate.id, ...payload }).unwrap();
      } else {
        await createTemplate(payload).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      if (err?.data?.fieldErrors) {
        setFieldErrors(err.data.fieldErrors);
      } else {
        alert(err?.data?.message || 'Failed to save template');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this quotation template?')) {
      try {
        await deleteTemplate(id).unwrap();
      } catch (err) {
        alert(err?.data?.message || 'Failed to delete template');
      }
    }
  };

  const columns = [
    {
      header: 'Template Name',
      key: 'name',
      render: (tmpl) => <strong className="template-name">{tmpl.name}</strong>,
    },
    {
      header: 'Plan',
      key: 'plan',
      render: (tmpl) => (
        <span>
          {tmpl.plan?.name} (₹{Number(tmpl.plan?.price || 0).toFixed(2)} / {tmpl.plan?.billingPeriod})
        </span>
      ),
    },
    {
      header: 'Validity',
      key: 'validityDays',
      render: (tmpl) => `${tmpl.validityDays} days`,
    },
    {
      header: 'Line Items',
      key: 'lines',
      render: (tmpl) => (
        <span className="template-line-count">
          {tmpl.lines?.length || 0} product lines
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (tmpl) => (
        <Badge status={tmpl.isActive ? 'active' : 'draft'}>
          {tmpl.isActive ? 'Active' : 'Archived'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (tmpl) => (
        <div className="template-actions">
          <Button size="sm" onClick={() => handleOpenEdit(tmpl)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(tmpl.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const selectedProductObj = allProducts.find((p) => p.id === Number(selectedProduct));

  return (
    <div className="templates-page">
      <div className="templates-page__head">
        <div>
          <h1>Quotation Templates</h1>
          <p>Preset subscription bundles containing default plans, product lines, and credit terms.</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + New Template
        </Button>
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.meta?.totalPages || 1}
        totalRecords={data?.meta?.total}
        onPageChange={setPage}
        emptyMessage="No quotation templates configured yet."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="680px"
        title={editingTemplate ? 'Edit Quotation Template' : 'Create Quotation Template'}
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
              {isCreating || isUpdating ? 'Saving…' : 'Save Template'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="template-form">
          <FormField label="Template Name" required error={fieldErrors.name}>
            <Input
              value={formData.name}
              placeholder="e.g. Odoo Standard Suite, Cloud Backup Yearly"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <div className="template-form__row">
            <FormField label="Assigned Plan" required error={fieldErrors.planId}>
              <Select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              >
                <option value="">Select a Plan</option>
                {allPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{Number(p.price).toFixed(2)} / {p.billingPeriod})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Default Payment Term" error={fieldErrors.paymentTermId}>
              <Select
                value={formData.paymentTermId}
                onChange={(e) => setFormData({ ...formData, paymentTermId: e.target.value })}
              >
                <option value="">Default (Due on receipt)</option>
                {allTerms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.dueDays} days)
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="template-form__row">
            <FormField
              label="Quotation Validity (Days)"
              required
              helperText="Days before quotation expires for customer confirmation"
              error={fieldErrors.validityDays}
            >
              <Input
                type="number"
                min="1"
                value={formData.validityDays}
                placeholder="30"
                onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
              />
            </FormField>
          </div>

          <div className="template-lines-box">
            <span className="lines-box-title">Preset Product Lines:</span>

            {formData.lines.length > 0 && (
              <div className="lines-table-wrap">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Tax</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, idx) => {
                      const prod = allProducts.find((p) => p.id === line.productId);
                      const variant = prod?.variants?.find((v) => v.id === line.variantId);
                      const tax = allTaxes.find((t) => t.id === line.taxId);
                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{prod?.name || `Product #${line.productId}`}</strong>
                            {variant && <small className="d-block">{variant.attribute}: {variant.value}</small>}
                          </td>
                          <td>{line.qty}</td>
                          <td>₹{Number(line.unitPrice !== null ? line.unitPrice : prod?.salesPrice || 0).toFixed(2)}</td>
                          <td>{tax ? tax.name : 'None'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Button size="sm" variant="danger" onClick={() => handleRemoveLine(idx)}>
                              ✕
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="line-draft-inputs">
              <Select
                value={selectedProduct}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">Select Product</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{Number(p.salesPrice).toFixed(2)})
                  </option>
                ))}
              </Select>

              {selectedProductObj?.variants && selectedProductObj.variants.length > 0 && (
                <Select
                  value={selectedVariant}
                  onChange={(e) => handleVariantSelect(e.target.value)}
                >
                  <option value="">Base Variant</option>
                  {selectedProductObj.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.attribute}: {v.value} (+₹{Number(v.extraPrice).toFixed(2)})
                    </option>
                  ))}
                </Select>
              )}

              <Input
                type="number"
                min="1"
                placeholder="Qty"
                style={{ width: '70px' }}
                value={lineQty}
                onChange={(e) => setLineQty(e.target.value)}
              />

              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Custom Price"
                style={{ width: '120px' }}
                value={linePrice}
                onChange={(e) => setLinePrice(e.target.value)}
              />

              <Select
                value={selectedTax}
                style={{ width: '130px' }}
                onChange={(e) => setSelectedTax(e.target.value)}
              >
                <option value="">No Tax</option>
                {allTaxes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>

              <Button size="sm" onClick={handleAddLine}>
                + Add Line
              </Button>
            </div>
          </div>

          <FormField label="Status">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Active and selectable when raising new customer quotations</span>
            </label>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
