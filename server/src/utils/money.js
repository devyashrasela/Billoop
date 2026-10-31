/**
 * Money utilities to prevent floating-point inaccuracies.
 * All monetary amounts in database are DECIMAL(12,2).
 * Internally, calculations convert to integer minor units (cents)
 * where 1 unit = 100 cents.
 */

/**
 * Converts a decimal amount (e.g., 10.50 or "10.50") to integer cents.
 * @param {number|string} amount
 * @returns {number} Integer cents
 */
export const toCents = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 0;
  }
  return Math.round(Number(amount) * 100);
};

/**
 * Converts integer cents back to a fixed 2-decimal number.
 * @param {number} cents
 * @returns {number}
 */
export const fromCents = (cents) => {
  return Number((Math.round(cents) / 100).toFixed(2));
};

/**
 * Formats an amount as a two-decimal string ("0.00").
 * @param {number|string} amount
 * @returns {string}
 */
export const formatMoney = (amount) => {
  return fromCents(toCents(amount)).toFixed(2);
};

/**
 * Safely adds multiple monetary amounts.
 * @param  {...(number|string)} amounts
 * @returns {number}
 */
export const addMoney = (...amounts) => {
  const sumCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0);
  return fromCents(sumCents);
};

/**
 * Safely subtracts b from a: (a - b).
 * @param {number|string} a
 * @param {number|string} b
 * @returns {number}
 */
export const subtractMoney = (a, b) => {
  return fromCents(toCents(a) - toCents(b));
};

/**
 * Safely multiplies a monetary amount by a quantity or factor.
 * @param {number|string} amount
 * @param {number} qty
 * @returns {number}
 */
export const multiplyMoney = (amount, qty) => {
  const cents = toCents(amount);
  return fromCents(Math.round(cents * Number(qty)));
};

/**
 * Calculates line tax according to Brightloop rules:
 * - If type === 'percentage': taxAmount = round((lineAmount - lineDiscount) * rate / 100, 2)
 * - If type === 'fixed': taxAmount = round(rate * qty, 2)
 *
 * @param {Object} params
 * @param {number|string} params.amount - Base line item amount (qty * unitPrice)
 * @param {number|string} [params.discount=0] - Discount applied to the line
 * @param {number|string} params.rate - Tax rate (percentage, e.g. 18.00, or flat fee per unit)
 * @param {'percentage'|'fixed'} [params.type='percentage']
 * @param {number} [params.qty=1]
 * @returns {number}
 */
export const calculateTax = ({ amount, discount = 0, rate = 0, type = 'percentage', qty = 1 }) => {
  const numRate = Number(rate) || 0;
  if (numRate <= 0) return 0;

  if (type === 'fixed') {
    // Flat fee per unit quantity
    return fromCents(Math.round(toCents(numRate) * Number(qty)));
  }

  // Percentage tax
  const baseCents = Math.max(0, toCents(amount) - toCents(discount));
  const taxCents = Math.round((baseCents * numRate) / 100);
  return fromCents(taxCents);
};

/**
 * Calculates discount amount:
 * - If type === 'percent': min(base, base * value / 100)
 * - If type === 'fixed': min(base, value)
 *
 * @param {Object} params
 * @param {number|string} params.baseAmount
 * @param {number|string} params.value - Percentage value or fixed amount
 * @param {'percent'|'fixed'} params.type
 * @returns {number}
 */
export const calculateDiscount = ({ baseAmount, value, type }) => {
  const baseCents = toCents(baseAmount);
  if (baseCents <= 0) return 0;

  const numVal = Number(value) || 0;
  if (numVal <= 0) return 0;

  let discountCents = 0;
  if (type === 'percent') {
    discountCents = Math.round((baseCents * numVal) / 100);
  } else {
    discountCents = toCents(numVal);
  }

  // Discount never exceeds base
  return fromCents(Math.min(baseCents, discountCents));
};
