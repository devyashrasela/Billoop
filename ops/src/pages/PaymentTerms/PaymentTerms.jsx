import React, { useState } from 'react';
import {
  useGetPaymentTermsQuery,
  useCreatePaymentTermMutation,
  useUpdatePaymentTermMutation,
  useDeletePaymentTermMutation,
} from '../../services/endpoints/paymentTermApi';
import {
  Table,
  Button,
  Modal,
  FormField,
  Input,
} from '../../components';
import './PaymentTerms.css';

const INITIAL_FORM = {
  name: '',
  dueDays: '',
};

export default function PaymentTerms() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data, isLoading } = useGetPaymentTermsQuery({ page, limit: 10 });
  const [createPaymentTerm, { isLoading: isCreating }] = useCreatePaymentTermMutation();
  const [updatePaymentTerm, { isLoading: isUpdating }] = useUpdatePaymentTermMutation();
  const [deletePaymentTerm] = useDeletePaymentTermMutation();

  const handleOpenCreate = () => {
    setEditingTerm(null);
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (term) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      dueDays: term.dueDays,
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTerm(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      if (editingTerm) {
        await updatePaymentTerm({
          id: editingTerm.id,
          ...formData,
          dueDays: Number(formData.dueDays),
        }).unwrap();
      } else {
        await createPaymentTerm({
          ...formData,
          dueDays: Number(formData.dueDays),
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
    if (window.confirm('Delete this payment term?')) {
      try {
        await deletePaymentTerm(id).unwrap();
      } catch (err) {
        alert(err?.data?.message || 'Failed to delete payment term');
      }
    }
  };

  const columns = [
    {
      header: 'Payment Term Name',
      key: 'name',
      render: (term) => <strong className="term-name">{term.name}</strong>,
    },
    {
      header: 'Due Days',
      key: 'dueDays',
      align: 'right',
      render: (term) => (
        <span>
          {term.dueDays === 0 ? 'Immediate / Net 0' : `${term.dueDays} days`}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (term) => (
        <div className="term-actions">
          <Button size="sm" onClick={() => handleOpenEdit(term)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(term.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="terms-page">
      <div className="terms-page__head">
        <div>
          <h1>Payment Terms</h1>
          <p>Configure credit terms and invoice due dates (e.g. Immediate, Net 15, Net 30).</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + New Payment Term
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
        emptyMessage="No payment terms configured yet."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTerm ? 'Edit Payment Term' : 'Create Payment Term'}
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
              {isCreating || isUpdating ? 'Saving…' : 'Save Payment Term'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="term-form">
          <FormField label="Term Name" required error={fieldErrors.name}>
            <Input
              value={formData.name}
              placeholder="e.g. Net 15, Net 30, Due on Receipt"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField
            label="Due Days from Invoice Date"
            required
            helperText="Number of days before invoice becomes overdue (0 = immediate)"
            error={fieldErrors.dueDays}
          >
            <Input
              type="number"
              min="0"
              value={formData.dueDays}
              placeholder="15"
              onChange={(e) => setFormData({ ...formData, dueDays: e.target.value })}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

