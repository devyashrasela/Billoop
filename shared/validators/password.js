// Rule: more than 8 chars (min 9), 1 uppercase, 1 lowercase, 1 special character
export const PASSWORD_RULES = [
  { id: 'length',  label: 'More than 8 characters', test: (p) => p.length > 8 },
  { id: 'upper',   label: 'One uppercase letter',   test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter',   test: (p) => /[a-z]/.test(p) },
  { id: 'special', label: 'One special character',  test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export const isValidPassword = (p = '') => PASSWORD_RULES.every((r) => r.test(p));

