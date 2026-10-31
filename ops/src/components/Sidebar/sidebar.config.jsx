import React from 'react';

export const DashboardIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const ReportsIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </svg>
);

export const CustomersSalesIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const CatalogPricingIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

export const AdminIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ChevronDownIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const SIDEBAR_MENU_CONFIG = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    to: '/dashboard',
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    icon: ReportsIcon,
    to: '/reports',
  },
  {
    key: 'customers-sales',
    label: 'Customers & Sales',
    icon: CustomersSalesIcon,
    children: [
      { label: 'Customers', to: '/customers' },
      { label: 'Subscriptions', to: '/subscriptions' },
      { label: 'Invoices', to: '/invoices' },
      { label: 'Payments', to: '/payments' },
    ],
  },
  {
    key: 'catalog-pricing',
    label: 'Catalog & Pricing',
    icon: CatalogPricingIcon,
    children: [
      { label: 'Products & Variants', to: '/products' },
      { label: 'Subscription Plans', to: '/plans' },
      { label: 'Quotation Templates', to: '/templates' },
      { label: 'Discounts & Coupons', to: '/discounts' },
      { label: 'Taxes', to: '/taxes' },
      { label: 'Payment Terms', to: '/payment-terms' },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: AdminIcon,
    adminOnly: true,
    children: [
      { label: 'Staff Management', to: '/staff' },
    ],
  },
];

