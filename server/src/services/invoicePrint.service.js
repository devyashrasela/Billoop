/**
 * Server-rendered HTML invoice template with responsive and print-ready CSS (@media print).
 */
export const renderInvoiceHtml = (invoice) => {
  const customer = invoice.customer || {};
  const lines = invoice.lines || [];
  const payments = invoice.payments || [];
  const subscription = invoice.subscription || {};

  const balanceDue = Math.max(0, Number(invoice.total || 0) - Number(invoice.amountPaid || 0));

  const formatMoney = (val) => `$${Number(val || 0).toFixed(2)}`;

  const linesHtml = lines
    .map(
      (line, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
        <strong>${escapeHtml(line.product?.name || line.description || 'Service/Product')}</strong>
        ${line.variant ? `<br><small style="color: #64748b;">${escapeHtml(line.variant.attributeValues || '')}</small>` : ''}
        ${line.description && line.description !== line.product?.name ? `<br><small style="color: #64748b;">${escapeHtml(line.description)}</small>` : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${line.qty}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(line.unitPrice)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${line.discountAmount > 0 ? formatMoney(line.discountAmount) : '—'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${Number(line.taxRate || 0) > 0 ? `${line.taxRate}%` : '0%'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatMoney(line.lineTotal)}</td>
    </tr>
  `
    )
    .join('');

  const paymentsHtml = payments.length
    ? `
      <div style="margin-top: 30px;">
        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin-bottom: 8px;">Payment History</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; text-align: left;">
              <th style="padding: 8px 12px;">Date</th>
              <th style="padding: 8px 12px;">Method</th>
              <th style="padding: 8px 12px;">Note</th>
              <th style="padding: 8px 12px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${payments
              .map(
                (p) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px;">${p.paidOn}</td>
                <td style="padding: 8px 12px; text-transform: capitalize;">${escapeHtml(p.method?.replace('_', ' ') || '')}</td>
                <td style="padding: 8px 12px; color: #64748b;">${escapeHtml(p.note || '—')}</td>
                <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #16a34a;">${formatMoney(p.amount)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${escapeHtml(invoice.number)} - Brightloop</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 30px 20px;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
    }
    .brand-logo {
      font-size: 24px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.5px;
    }
    .invoice-status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-paid { background: #dcfce7; color: #15803d; }
    .badge-confirmed { background: #fef3c7; color: #b45309; }
    .badge-draft { background: #f1f5f9; color: #475569; }
    .badge-cancelled { background: #fee2e2; color: #b91c1c; }

    .address-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 20px;
    }
    .address-box {
      flex: 1;
      font-size: 14px;
      line-height: 1.5;
    }
    .address-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 6px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-bottom: 25px;
    }
    table.items-table th {
      background: #f8fafc;
      padding: 10px 12px;
      border-bottom: 2px solid #cbd5e1;
      color: #475569;
      font-weight: 600;
      text-align: left;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 280px;
      font-size: 14px;
    }
    .totals-table tr td {
      padding: 6px 0;
    }
    .totals-table tr td:last-child {
      text-align: right;
    }
    .totals-table tr.grand-total td {
      border-top: 2px solid #0f172a;
      font-size: 16px;
      font-weight: 700;
      padding-top: 10px;
    }
    .totals-table tr.balance-due td {
      font-size: 16px;
      font-weight: 800;
      color: #4f46e5;
      padding-top: 6px;
    }
    .print-btn-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
    }
    .print-btn {
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .print-btn-bar {
        display: none !important;
      }
      .invoice-card {
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header-row">
      <div>
        <div class="brand-logo">Brightloop</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
          Subscription Management & Billing Platform
        </div>
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0 0 6px 0; font-size: 22px;">INVOICE</h2>
        <div style="font-size: 15px; font-weight: 700; color: #4f46e5;">${escapeHtml(invoice.number)}</div>
        <div style="margin-top: 6px;">
          <span class="invoice-status-badge badge-${invoice.status}">${invoice.status}</span>
        </div>
      </div>
    </div>

    <div class="address-grid">
      <div class="address-box">
        <div class="address-title">Billed To</div>
        <strong>${escapeHtml(customer.name || 'Valued Customer')}</strong><br>
        ${customer.company ? `<span>${escapeHtml(customer.company)}</span><br>` : ''}
        ${customer.addressLine1 ? `<span>${escapeHtml(customer.addressLine1)}</span><br>` : ''}
        ${customer.city || customer.country ? `<span>${[customer.city, customer.state, customer.postalCode, customer.country].filter(Boolean).map(escapeHtml).join(', ')}</span><br>` : ''}
        ${customer.phone ? `<span>Phone: ${escapeHtml(customer.phone)}</span><br>` : ''}
      </div>

      <div class="address-box" style="text-align: right;">
        <div class="address-title">Invoice Details</div>
        <div><strong>Issue Date:</strong> ${invoice.issueDate}</div>
        <div><strong>Due Date:</strong> ${invoice.dueDate}</div>
        ${invoice.periodStart && invoice.periodEnd ? `<div><strong>Billing Period:</strong> ${invoice.periodStart} to ${invoice.periodEnd}</div>` : ''}
        ${subscription.number ? `<div><strong>Subscription:</strong> ${escapeHtml(subscription.number)}</div>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Description</th>
          <th style="width: 50px; text-align: center;">Qty</th>
          <th style="width: 90px; text-align: right;">Unit Price</th>
          <th style="width: 80px; text-align: right;">Discount</th>
          <th style="width: 60px; text-align: right;">Tax</th>
          <th style="width: 90px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${linesHtml}
      </tbody>
    </table>

    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Subtotal:</td>
          <td>${formatMoney(invoice.subtotal)}</td>
        </tr>
        ${Number(invoice.discountTotal || 0) > 0 ? `
          <tr>
            <td style="color: #64748b;">Discount:</td>
            <td style="color: #dc2626;">-${formatMoney(invoice.discountTotal)}</td>
          </tr>
        ` : ''}
        <tr>
          <td style="color: #64748b;">Tax Total:</td>
          <td>${formatMoney(invoice.taxTotal)}</td>
        </tr>
        <tr class="grand-total">
          <td>Total:</td>
          <td>${formatMoney(invoice.total)}</td>
        </tr>
        <tr>
          <td style="color: #16a34a;">Amount Paid:</td>
          <td style="color: #16a34a; font-weight: 600;">${formatMoney(invoice.amountPaid)}</td>
        </tr>
        <tr class="balance-due">
          <td>Balance Due:</td>
          <td>${formatMoney(balanceDue)}</td>
        </tr>
      </table>
    </div>

    ${paymentsHtml}

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      Thank you for your business! Please remit payment by the due date.
    </div>
  </div>
</body>
</html>`;
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
