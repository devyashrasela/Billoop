import { calculateTax, addMoney } from '../utils/money.js';

/**
 * Computes tax for a single line item.
 *
 * @param {Object} params
 * @param {number|string} params.amount - Base pre-tax amount (unitPrice * qty)
 * @param {number|string} [params.discount=0] - Discount amount applied to this line
 * @param {Object} [params.tax] - Tax model instance or object { id, rate, type }
 * @param {number} [params.qty=1]
 * @returns {{ taxAmount: number, taxRate: number, taxId: number|null }}
 */
export const computeLineTax = ({ amount, discount = 0, tax, qty = 1 }) => {
  if (!tax || Number(tax.rate) <= 0) {
    return {
      taxAmount: 0.0,
      taxRate: 0.0,
      taxId: tax?.id || null,
    };
  }

  const rate = Number(tax.rate);
  const type = tax.type || 'percentage';

  const taxAmount = calculateTax({
    amount,
    discount,
    rate,
    type,
    qty,
  });

  return {
    taxAmount,
    taxRate: rate,
    taxId: tax.id,
  };
};

/**
 * Computes total tax for an array of lines.
 *
 * @param {Array<{ taxAmount: number }>} lines
 * @returns {number} Sum of all line tax amounts
 */
export const sumLineTaxes = (lines = []) => {
  const taxAmounts = lines.map((line) => line.taxAmount || 0);
  return addMoney(...taxAmounts);
};
