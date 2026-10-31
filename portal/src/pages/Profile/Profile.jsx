import React, { useState, useEffect } from 'react';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '../../services/endpoints/portalApi';
import { Card, FormField, Input, Button } from '../../components';
import './Profile.css';

export default function Profile() {
  const { data: customer, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    taxId: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        company: customer.company || '',
        phone: customer.phone || '',
        taxId: customer.taxId || '',
        addressLine1: customer.addressLine1 || '',
        addressLine2: customer.addressLine2 || '',
        city: customer.city || '',
        state: customer.state || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'India',
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateProfile(formData).unwrap();
      setSuccessMsg('Your profile and billing details have been successfully updated.');
    } catch (err) {
      setErrorMsg(err.data?.message || 'Failed to update profile information');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
        Loading your account profile...
      </div>
    );
  }

  return (
    <div className="portal-profile-page">
      <div className="portal-profile-header">
        <h1>My Account Profile</h1>
        <p>Update your company details, primary contact information, and billing address</p>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'var(--green-soft, #dcefe3)',
            color: 'var(--green, #1f7a4d)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm, 4px)',
            fontWeight: 500,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: 'var(--red-soft, #f6dcd9)',
            border: '1px solid var(--red-border, #e3b9b5)',
            color: 'var(--red, #b3261e)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm, 4px)',
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="portal-profile-form">
        <Card title="Contact & Business Details">
          <div className="portal-profile-grid">
            <FormField label="Full Name" required>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Email Address">
              <Input
                disabled
                value={customer?.user?.email || ''}
              />
            </FormField>

            <FormField label="Company Name">
              <Input
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Phone Number">
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Tax ID / GSTIN / VAT">
              <Input
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
              />
            </FormField>
          </div>
        </Card>

        <Card title="Billing Address">
          <div className="portal-profile-grid">
            <FormField label="Address Line 1">
              <Input
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Address Line 2">
              <Input
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="City">
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="State / Province">
              <Input
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Postal / ZIP Code">
              <Input
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Country">
              <Input
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </FormField>
          </div>

          <div className="portal-profile-footer">
            <Button variant="primary" type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
