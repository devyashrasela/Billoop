import React, { useState } from 'react';
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from '../../services/endpoints/customerApi';
import {
  Table,
  Button,
  Badge,
  Modal,
  FormField,
  Input,
} from '../../components';
import './Customers.css';

const INITIAL_FORM = {
  name: '',
  email: '',
  company: '',
  phone: '',
  taxId: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export default function Customers() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data, isLoading } = useGetCustomersQuery({
    page,
    limit: 10,
    q: searchQuery.trim() || undefined,
  });

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      email: cust.user?.email || '',
      company: cust.company || '',
      phone: cust.phone || '',
      taxId: cust.taxId || '',
      addressLine1: cust.addressLine1 || '',
      addressLine2: cust.addressLine2 || '',
      city: cust.city || '',
      state: cust.state || '',
      postalCode: cust.postalCode || '',
      country: cust.country || 'India',
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer.id, ...formData }).unwrap();
      } else {
        await createCustomer(formData).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      if (err?.data?.fieldErrors) {
        setFieldErrors(err.data.fieldErrors);
      } else {
        alert(err?.data?.message || 'Failed to save customer');
      }
    }
  };

  const columns = [
    {
      header: 'Customer',
      key: 'name',
      render: (cust) => (
        <div>
          <strong className="customer-name">{cust.name}</strong>
          {cust.company && <div className="customer-company">{cust.company}</div>}
        </div>
      ),
    },
    {
      header: 'Email & Contact',
      key: 'contact',
      render: (cust) => (
        <div>
          <div className="customer-email">{cust.user?.email}</div>
          {cust.phone && <div className="customer-phone">{cust.phone}</div>}
        </div>
      ),
    },
    {
      header: 'Location',
      key: 'location',
      render: (cust) => (
        <span>{[cust.city, cust.state].filter(Boolean).join(', ') || '—'}</span>
      ),
    },
    {
      header: 'Tax ID / GST',
      key: 'taxId',
      render: (cust) => cust.taxId || '—',
    },
    {
      header: 'Status',
      key: 'status',
      render: (cust) => (
        <Badge status={cust.user?.isActive ? 'active' : 'draft'}>
          {cust.user?.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (cust) => (
        <div className="customer-actions">
          <Button size="sm" onClick={() => handleOpenEdit(cust)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="customers-page">
      <div className="customers-page__head">
        <div>
          <h1>Customers Directory</h1>
          <p>Manage customer profiles, company billing addresses, and linked subscriptions.</p>
        </div>
        <div className="customers-page__search-bar">
          <Input
            placeholder="Search by name, company, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{ width: '260px' }}
          />
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Customer
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
        emptyMessage="No customers found."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="620px"
        title={editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
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
              {isCreating || isUpdating ? 'Saving…' : 'Save Customer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="customer-form">
          <div className="customer-form__row">
            <FormField label="Full Name" required error={fieldErrors.name}>
              <Input
                value={formData.name}
                placeholder="e.g. Rahul Sharma"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField
              label="Email Address"
              required
              helperText={editingCustomer ? 'Cannot be changed' : 'Used for portal login'}
              error={fieldErrors.email}
            >
              <Input
                type="email"
                value={formData.email}
                disabled={Boolean(editingCustomer)}
                placeholder="rahul@company.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>
          </div>

          <div className="customer-form__row">
            <FormField label="Company Name" error={fieldErrors.company}>
              <Input
                value={formData.company}
                placeholder="e.g. Acme Technologies Pvt Ltd"
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </FormField>

            <FormField label="Phone Number" error={fieldErrors.phone}>
              <Input
                value={formData.phone}
                placeholder="+91 98765 43210"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </FormField>
          </div>

          <div className="customer-form__row">
            <FormField label="GST / Tax ID" error={fieldErrors.taxId}>
              <Input
                value={formData.taxId}
                placeholder="27ABCDE1234F1Z5"
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </FormField>

            <FormField label="Country" error={fieldErrors.country}>
              <Input
                value={formData.country}
                placeholder="India"
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Billing Address Line 1" error={fieldErrors.addressLine1}>
            <Input
              value={formData.addressLine1}
              placeholder="Building, Street, Area"
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            />
          </FormField>

          <div className="customer-form__row">
            <FormField label="City" error={fieldErrors.city}>
              <Input
                value={formData.city}
                placeholder="Mumbai"
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </FormField>

            <FormField label="State" error={fieldErrors.state}>
              <Input
                value={formData.state}
                placeholder="Maharashtra"
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </FormField>

            <FormField label="Postal Code" error={fieldErrors.postalCode}>
              <Input
                value={formData.postalCode}
                placeholder="400001"
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
