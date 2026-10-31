import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useCreateSubscriptionMutation,
  useCreateFromTemplateMutation,
} from '../../services/endpoints/subscriptionApi';
import { useGetCustomersQuery } from '../../services/endpoints/customerApi';
import { useGetTemplatesQuery } from '../../services/endpoints/templateApi';
import { useGetPlansQuery } from '../../services/endpoints/planApi';
import { useGetPaymentTermsQuery } from '../../services/endpoints/paymentTermApi';
import { useGetProductsQuery } from '../../services/endpoints/productApi';
import { useGetTaxesQuery } from '../../services/endpoints/taxApi';
import { Button, Card, FormField, Input, Select } from '../../components';
import './SubscriptionCreate.css';

export default function SubscriptionCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('template'); // 'template' | 'custom'
  const today = new Date().toISOString().split('T')[0];

  // Queries for select dropdowns
  const { data: customersData } = useGetCustomersQuery({ limit: 100 });
  const { data: templatesData } = useGetTemplatesQuery();
  const { data: plansData } = useGetPlansQuery();
  const { data: paymentTermsData } = useGetPaymentTermsQuery();
  const { data: productsData } = useGetProductsQuery();
  const { data: taxesData } = useGetTaxesQuery();

  const [createSubscription, { isLoading: isCreatingCustom }] = useCreateSubscriptionMutation();
  const [createFromTemplate, { isLoading: isCreatingTemplate }] = useCreateFromTemplateMutation();

  // Template Form State
  const [templateForm, setTemplateForm] = useState({
    templateId: '',
    customerId: '',
    startDate: today,
  });

  // Custom Form State
  const [customForm, setCustomForm] = useState({
    customerId: '',
    planId: '',
    paymentTermId: '',
    startDate: today,
    lines: [
      {
        productId: '',
        variantId: null,
        qty: 1,
        unitPrice: 0,
        taxId: '',
      },
    ],
  });

  const [errorMsg, setErrorMsg] = useState('');

  const customers = customersData?.data || [];
  const templates = templatesData?.data || templatesData || [];
  const plans = plansData?.data || plansData || [];
  const paymentTerms = paymentTermsData?.data || paymentTermsData || [];
  const products = productsData?.data || productsData || [];
  const taxes = taxesData?.data || taxesData || [];

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!templateForm.templateId || !templateForm.customerId) {
      setErrorMsg('Please select both a quotation template and a customer.');
      return;
    }

    try {
      const res = await createFromTemplate({
        templateId: Number(templateForm.templateId),
        customerId: Number(templateForm.customerId),
        startDate: templateForm.startDate || null,
      }).unwrap();

      navigate(`/subscriptions/${res.id}`);
    } catch (err) {
      setErrorMsg(err.data?.message || 'Failed to create subscription from template');
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customForm.customerId || !customForm.planId || !customForm.paymentTermId) {
      setErrorMsg('Please complete all required customer, plan, and payment term fields.');
      return;
    }

    if (!customForm.lines.length || customForm.lines.some((l) => !l.productId)) {
      setErrorMsg('Please ensure all line items have a valid product selected.');
      return;
    }

    try {
      const payload = {
        customerId: Number(customForm.customerId),
        planId: Number(customForm.planId),
        paymentTermId: Number(customForm.paymentTermId),
        startDate: customForm.startDate || null,
        lines: customForm.lines.map((l) => ({
          productId: Number(l.productId),
          variantId: l.variantId ? Number(l.variantId) : null,
          qty: Number(l.qty) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          taxId: l.taxId ? Number(l.taxId) : null,
        })),
      };

      const res = await createSubscription(payload).unwrap();
      navigate(`/subscriptions/${res.id}`);
    } catch (err) {
      setErrorMsg(err.data?.message || 'Failed to create custom subscription');
    }
  };

  const handleAddLine = () => {
    setCustomForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          productId: '',
          variantId: null,
          qty: 1,
          unitPrice: 0,
          taxId: '',
        },
      ],
    }));
  };

  const handleRemoveLine = (idx) => {
    if (customForm.lines.length <= 1) return;
    setCustomForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx),
    }));
  };

  const handleLineProductChange = (idx, prodId) => {
    const prod = products.find((p) => String(p.id) === String(prodId));
    setCustomForm((prev) => {
      const nextLines = [...prev.lines];
      nextLines[idx] = {
        ...nextLines[idx],
        productId: prodId,
        unitPrice: prod ? Number(prod.salesPrice || 0) : 0,
        taxId: prod?.taxId ? String(prod.taxId) : '',
      };
      return { ...prev, lines: nextLines };
    });
  };

  const handleLineFieldChange = (idx, field, val) => {
    setCustomForm((prev) => {
      const nextLines = [...prev.lines];
      nextLines[idx] = { ...nextLines[idx], [field]: val };
      return { ...prev, lines: nextLines };
    });
  };

  const isSubmitting = isCreatingTemplate || isCreatingCustom;

  return (
    <div className="sub-create-page">
      <div className="sub-create-header">
        <Link to="/subscriptions" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          ← Back to Subscriptions
        </Link>
        <h1>Create New Subscription</h1>
        <p>Set up recurring contracts from pre-configured templates or custom item configurations</p>
      </div>

      <div className="sub-mode-toggle">
        <div
          className={`sub-mode-card ${mode === 'template' ? 'sub-mode-card--active' : ''}`}
          onClick={() => setMode('template')}
        >
          <div className="sub-mode-title">⚡ From Quotation Template</div>
          <div className="sub-mode-desc">
            Instantly spin up a subscription using pre-defined plans, products, and pricing templates.
          </div>
        </div>

        <div
          className={`sub-mode-card ${mode === 'custom' ? 'sub-mode-card--active' : ''}`}
          onClick={() => setMode('custom')}
        >
          <div className="sub-mode-title">🛠 Custom Subscription</div>
          <div className="sub-mode-desc">
            Configure custom billing terms, select specific plans, and assemble manual line items.
          </div>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.25rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {mode === 'template' ? (
        <form onSubmit={handleTemplateSubmit}>
          <Card title="Quotation Template Configuration">
            <div className="sub-form-grid">
              <FormField label="Select Quotation Template" required>
                <Select
                  value={templateForm.templateId}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, templateId: e.target.value })
                  }
                  required
                >
                  <option value="">-- Choose a template --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.plan?.name || 'Plan'} - {tpl.plan?.billingPeriod || ''})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Customer" required>
                <Select
                  value={templateForm.customerId}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, customerId: e.target.value })
                  }
                  required
                >
                  <option value="">-- Choose a customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Start Date">
                <Input
                  type="date"
                  value={templateForm.startDate}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, startDate: e.target.value })
                  }
                />
              </FormField>
            </div>

            <div className="sub-create-footer">
              <Button variant="secondary" onClick={() => navigate('/subscriptions')} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isCreatingTemplate ? 'Creating...' : 'Create Subscription'}
              </Button>
            </div>
          </Card>
        </form>
      ) : (
        <form onSubmit={handleCustomSubmit}>
          <Card title="Contract & Billing Terms">
            <div className="sub-form-grid">
              <FormField label="Customer" required>
                <Select
                  value={customForm.customerId}
                  onChange={(e) => setCustomForm({ ...customForm, customerId: e.target.value })}
                  required
                >
                  <option value="">-- Choose a customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Plan" required>
                <Select
                  value={customForm.planId}
                  onChange={(e) => setCustomForm({ ...customForm, planId: e.target.value })}
                  required
                >
                  <option value="">-- Choose a plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.billingPeriod})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Payment Term" required>
                <Select
                  value={customForm.paymentTermId}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, paymentTermId: e.target.value })
                  }
                  required
                >
                  <option value="">-- Choose payment term --</option>
                  {paymentTerms.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Start Date">
                <Input
                  type="date"
                  value={customForm.startDate}
                  onChange={(e) => setCustomForm({ ...customForm, startDate: e.target.value })}
                />
              </FormField>
            </div>
          </Card>

          <div style={{ marginTop: '1.5rem' }}>
            <Card title="Line Items">
              <div style={{ marginBottom: '0.5rem' }}>
                {customForm.lines.map((line, idx) => (
                  <div key={idx} className="sub-line-row">
                    <FormField label={idx === 0 ? 'Product' : ''}>
                      <Select
                        value={line.productId}
                        onChange={(e) => handleLineProductChange(idx, e.target.value)}
                        required
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${Number(p.salesPrice || 0).toFixed(2)})
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label={idx === 0 ? 'Qty' : ''}>
                      <Input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) => handleLineFieldChange(idx, 'qty', e.target.value)}
                        required
                      />
                    </FormField>

                    <FormField label={idx === 0 ? 'Unit Price ($)' : ''}>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) =>
                          handleLineFieldChange(idx, 'unitPrice', e.target.value)
                        }
                        required
                      />
                    </FormField>

                    <FormField label={idx === 0 ? 'Tax' : ''}>
                      <Select
                        value={line.taxId}
                        onChange={(e) => handleLineFieldChange(idx, 'taxId', e.target.value)}
                      >
                        <option value="">No Tax</option>
                        {taxes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.rate}%)
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <div className="sub-line-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={customForm.lines.length <= 1}
                        onClick={() => handleRemoveLine(idx)}
                        type="button"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="secondary" size="sm" onClick={handleAddLine} type="button">
                + Add Another Line
              </Button>

              <div className="sub-create-footer">
                <Button variant="secondary" onClick={() => navigate('/subscriptions')} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isCreatingCustom ? 'Creating...' : 'Create Subscription'}
                </Button>
              </div>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
