import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { FormField, Input, Select } from '../FormField/FormField';
import { useRecordPaymentMutation } from '../../services/endpoints/paymentApi';
import './RecordPaymentModal.css';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Credit / Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export function RecordPaymentModal({ isOpen, onClose, invoice }) {
  const [recordPayment, { isLoading }] = useRecordPaymentMutation();
  const today = new Date().toISOString().split('T')[0];

  const total = Number(invoice?.total || 0);
  const amountPaid = Number(invoice?.amountPaid || 0);
  const balanceDue = Math.max(0, total - amountPaid);

  const [formData, setFormData] = useState({
    amount: balanceDue > 0 ? balanceDue.toFixed(2) : '0.00',
    method: 'bank_transfer',
    paidOn: today,
    note: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (invoice) {
      const remaining = Math.max(0, Number(invoice.total || 0) - Number(invoice.amountPaid || 0));
      setFormData({
        amount: remaining > 0 ? remaining.toFixed(2) : '0.00',
        method: 'bank_transfer',
        paidOn: today,
        note: '',
      });
      setErrorMsg('');
    }
  }, [invoice, today]);

  if (!invoice) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const amt = Number(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (amt > balanceDue + 0.001) {
      setErrorMsg(`Payment amount cannot exceed balance due ($${balanceDue.toFixed(2)}).`);
      return;
    }

    try {
      await recordPayment({
        invoiceId: invoice.id,
        amount: amt,
        method: formData.method,
        paidOn: formData.paidOn || today,
        note: formData.note.trim() || undefined,
      }).unwrap();

      onClose();
    } catch (err) {
      setErrorMsg(err.data?.message || 'Failed to record payment');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment - ${invoice.number}`}
    >
      <div className="record-payment-summary">
        <div className="record-payment-row">
          <span>Invoice Total:</span>
          <strong>${total.toFixed(2)}</strong>
        </div>
        <div className="record-payment-row">
          <span>Amount Already Paid:</span>
          <span style={{ color: 'var(--color-success, #16a34a)' }}>
            ${amountPaid.toFixed(2)}
          </span>
        </div>
        <div className="record-payment-row record-payment-row--highlight">
          <span>Remaining Balance Due:</span>
          <span>${balanceDue.toFixed(2)}</span>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="record-payment-form">
        <FormField label="Payment Amount ($)" required>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={balanceDue}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </FormField>

        <FormField label="Payment Method" required>
          <Select
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            required
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Payment Date" required>
          <Input
            type="date"
            value={formData.paidOn}
            onChange={(e) => setFormData({ ...formData, paidOn: e.target.value })}
            required
          />
        </FormField>

        <FormField label="Reference Note / Memo">
          <Input
            placeholder="e.g. Wire confirmation #, UTR #, Cheque #004"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </FormField>

        <div className="record-payment-actions">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Recording...' : 'Confirm Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
