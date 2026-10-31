import React, { useState } from 'react';
import {
  useGetTaxesQuery,
  useCreateTaxMutation,
  useUpdateTaxMutation,
  useDeleteTaxMutation,
} from '../../services/endpoints/taxApi';
import {
  Table,
  Button,
  Badge,
  Modal,
  FormField,
  Input,
  Select,
} from '../../components';
import './Taxes.css';

const INITIAL_FORM = {
  name: '',
  rate: '',
  type: 'percentage',
  isActive: true,
};

export default function Taxes() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data, isLoading } = useGetTaxesQuery({ page, limit: 10 });
  const [createTax, { isLoading: isCreating }] = useCreateTaxMutation();
  const [updateTax, { isLoading: isUpdating }] = useUpdateTaxMutation();
  const [deleteTax] = useDeleteTaxMutation();

  const handleOpenCreate = () => {
    setEditingTax(null);
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tax) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      rate: tax.rate,
      type: tax.type,
      isActive: tax.isActive,
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTax(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      if (editingTax) {
        await updateTax({
          id: editingTax.id,
          ...formData,
          rate: Number(formData.rate),
        }).unwrap();
      } else {
        await createTax({
          ...formData,
          rate: Number(formData.rate),
        }).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      if (err?.data?.fieldErrors) {
        setFieldErrors(err.data.fieldErrors);
      } else {
        alert(err?.data?.message || 'Action failed');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax rule?')) {
      try {
        await deleteTax(id).unwrap();
      } catch (err) {
        alert(err?.data?.message || 'Failed to delete tax');
      }
    }
  };

  const columns = [
    {
      header: 'Tax Name',
      key: 'name',
      render: (tax) => <strong className="tax-name">{tax.name}</strong>,
    },
    {
      header: 'Type',
      key: 'type',
      render: (tax) => (
        <span className="tax-type">{tax.type === 'percentage' ? 'Percentage' : 'Fixed Fee'}</span>
      ),
    },
    {
      header: 'Rate',
      key: 'rate',
      align: 'right',
      render: (tax) =>
        tax.type === 'percentage' ? `${tax.rate}%` : `₹${Number(tax.rate).toFixed(2)}`,
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (tax) => (
        <Badge status={tax.isActive ? 'active' : 'draft'}>
          {tax.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (tax) => (
        <div className="tax-actions">
          <Button size="sm" onClick={() => handleOpenEdit(tax)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(tax.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="taxes-page">
      <div className="taxes-page__head">
        <div>
          <h1>Taxes & Rules</h1>
          <p>Define tax rates and fixed fees automatically applied to invoice lines.</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + New Tax Rule
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
        emptyMessage="No tax rules configured yet."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTax ? 'Edit Tax Rule' : 'Create Tax Rule'}
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
              {isCreating || isUpdating ? 'Saving…' : 'Save Tax'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="tax-form">
          <FormField label="Tax Name" required error={fieldErrors.name}>
            <Input
              value={formData.name}
              placeholder="e.g. GST 18%, Service Fee"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <div className="tax-form__row">
            <FormField label="Calculation Type" required error={fieldErrors.type}>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Fee (Amount)</option>
              </Select>
            </FormField>

            <FormField
              label={formData.type === 'percentage' ? 'Rate (%)' : 'Amount (₹)'}
              required
              error={fieldErrors.rate}
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.rate}
                placeholder="18.00"
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Status">
            <label className="tax-form__checkbox">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Active and selectable in catalog items</span>
            </label>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

