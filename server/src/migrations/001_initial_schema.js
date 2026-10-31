import { DataTypes } from 'sequelize';
import {
  ROLES,
  BILLING_PERIODS,
  SUBSCRIPTION_STATUS,
  INVOICE_STATUS,
  PAYMENT_METHODS,
  PRODUCT_TYPES,
  TAX_TYPES,
  DISCOUNT_TYPES,
  DISCOUNT_SCOPES,
} from '../../../shared/constants/index.js';

export const up = async ({ context: queryInterface }) => {
  // 1. users
  await queryInterface.createTable('users', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM(Object.values(ROLES)), allowNull: false, defaultValue: ROLES.CUSTOMER },
    name: { type: DataTypes.STRING(255), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    resetTokenHash: { type: DataTypes.STRING(255), allowNull: true },
    resetExpiresAt: { type: DataTypes.DATE, allowNull: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('users', ['role']);
  await queryInterface.addIndex('users', ['isActive']);

  // 2. refresh_tokens
  await queryInterface.createTable('refresh_tokens', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    tokenHash: { type: DataTypes.STRING(255), allowNull: false },
    familyId: { type: DataTypes.STRING(100), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('refresh_tokens', ['userId']);
  await queryInterface.addIndex('refresh_tokens', ['tokenHash']);
  await queryInterface.addIndex('refresh_tokens', ['familyId']);

  // 3. customers
  await queryInterface.createTable('customers', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    company: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    addressLine1: { type: DataTypes.STRING(255), allowNull: true },
    addressLine2: { type: DataTypes.STRING(255), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    postalCode: { type: DataTypes.STRING(20), allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: true },
    taxId: { type: DataTypes.STRING(100), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('customers', ['name']);
  await queryInterface.addIndex('customers', ['company']);

  // 4. audit_logs
  await queryInterface.createTable('audit_logs', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    actorId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    entity: { type: DataTypes.STRING(50), allowNull: false },
    entityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    before: { type: DataTypes.JSON, allowNull: true },
    after: { type: DataTypes.JSON, allowNull: true },
    at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await queryInterface.addIndex('audit_logs', ['entity', 'entityId']);
  await queryInterface.addIndex('audit_logs', ['actorId']);
  await queryInterface.addIndex('audit_logs', ['at']);

  // 5. sequences
  await queryInterface.createTable('sequences', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    lastValue: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  // 6. products
  await queryInterface.createTable('products', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.ENUM(PRODUCT_TYPES), allowNull: false, defaultValue: 'service' },
    salesPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    costPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  });
  await queryInterface.addIndex('products', ['name']);
  await queryInterface.addIndex('products', ['type']);
  await queryInterface.addIndex('products', ['isActive']);

  // 7. product_variants
  await queryInterface.createTable('product_variants', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
      onDelete: 'CASCADE',
    },
    attribute: { type: DataTypes.STRING(100), allowNull: false },
    value: { type: DataTypes.STRING(100), allowNull: false },
    extraPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('product_variants', ['productId', 'attribute', 'value'], { unique: true });
  await queryInterface.addIndex('product_variants', ['productId']);

  // 8. plans
  await queryInterface.createTable('plans', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    billingPeriod: { type: DataTypes.ENUM(BILLING_PERIODS), allowNull: false, defaultValue: 'monthly' },
    minQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    availableFrom: { type: DataTypes.DATEONLY, allowNull: true },
    availableTo: { type: DataTypes.DATEONLY, allowNull: true },
    autoClose: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    allowEarlyClose: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    allowPause: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    allowRenew: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  });
  await queryInterface.addIndex('plans', ['name']);
  await queryInterface.addIndex('plans', ['billingPeriod']);
  await queryInterface.addIndex('plans', ['isActive']);

  // 9. taxes
  await queryInterface.createTable('taxes', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    type: { type: DataTypes.ENUM(TAX_TYPES), allowNull: false, defaultValue: 'percentage' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  });
  await queryInterface.addIndex('taxes', ['name']);
  await queryInterface.addIndex('taxes', ['isActive']);

  // 10. payment_terms
  await queryInterface.createTable('payment_terms', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    dueDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('payment_terms', ['name']);

  // 11. quotation_templates
  await queryInterface.createTable('quotation_templates', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    planId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'plans', key: 'id' },
    },
    validityDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    paymentTermId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'payment_terms', key: 'id' },
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  });
  await queryInterface.addIndex('quotation_templates', ['name']);
  await queryInterface.addIndex('quotation_templates', ['planId']);
  await queryInterface.addIndex('quotation_templates', ['paymentTermId']);

  // 12. template_lines
  await queryInterface.createTable('template_lines', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    templateId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'quotation_templates', key: 'id' },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
    },
    variantId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'product_variants', key: 'id' },
    },
    qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    taxId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'taxes', key: 'id' },
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('template_lines', ['templateId']);
  await queryInterface.addIndex('template_lines', ['productId']);

  // 13. discounts
  await queryInterface.createTable('discounts', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    type: { type: DataTypes.ENUM(DISCOUNT_TYPES), allowNull: false, defaultValue: 'percent' },
    value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    minPurchase: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0.0 },
    minQty: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    usageLimit: { type: DataTypes.INTEGER, allowNull: true },
    usedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    scope: { type: DataTypes.ENUM(DISCOUNT_SCOPES), allowNull: false, defaultValue: 'subscription' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  });
  await queryInterface.addIndex('discounts', ['isActive', 'startDate', 'endDate']);
  await queryInterface.addIndex('discounts', ['scope']);

  // 14. discount_products
  await queryInterface.createTable('discount_products', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    discountId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'discounts', key: 'id' },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
      onDelete: 'CASCADE',
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('discount_products', ['discountId', 'productId'], { unique: true });

  // 15. subscriptions
  await queryInterface.createTable('subscriptions', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    customerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'customers', key: 'id' },
    },
    planId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'plans', key: 'id' },
    },
    templateId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'quotation_templates', key: 'id' },
    },
    paymentTermId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'payment_terms', key: 'id' },
    },
    status: { type: DataTypes.ENUM(SUBSCRIPTION_STATUS), allowNull: false, defaultValue: 'draft' },
    isPaused: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    nextBillingDate: { type: DataTypes.DATEONLY, allowNull: true },
    quotationValidUntil: { type: DataTypes.DATEONLY, allowNull: true },
    closedAt: { type: DataTypes.DATE, allowNull: true },
    closeReason: { type: DataTypes.STRING(255), allowNull: true },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('subscriptions', ['status', 'nextBillingDate']);
  await queryInterface.addIndex('subscriptions', ['customerId']);
  await queryInterface.addIndex('subscriptions', ['planId']);

  // 16. subscription_lines
  await queryInterface.createTable('subscription_lines', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    subscriptionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'subscriptions', key: 'id' },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
    },
    variantId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'product_variants', key: 'id' },
    },
    description: { type: DataTypes.STRING(255), allowNull: true },
    qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    taxId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'taxes', key: 'id' },
    },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('subscription_lines', ['subscriptionId']);

  // 17. subscription_discounts
  await queryInterface.createTable('subscription_discounts', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    subscriptionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'subscriptions', key: 'id' },
      onDelete: 'CASCADE',
    },
    discountId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'discounts', key: 'id' },
      onDelete: 'CASCADE',
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('subscription_discounts', ['subscriptionId', 'discountId'], { unique: true });

  // 18. invoices
  await queryInterface.createTable('invoices', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    subscriptionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'subscriptions', key: 'id' },
      onDelete: 'SET NULL',
    },
    customerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'customers', key: 'id' },
    },
    periodStart: { type: DataTypes.DATEONLY, allowNull: true },
    periodEnd: { type: DataTypes.DATEONLY, allowNull: true },
    issueDate: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM(INVOICE_STATUS), allowNull: false, defaultValue: 'draft' },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    discountTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    taxTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    amountPaid: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('invoices', ['subscriptionId', 'periodStart'], {
    unique: true,
    name: 'unique_subscription_period_start',
  });
  await queryInterface.addIndex('invoices', ['status', 'dueDate']);
  await queryInterface.addIndex('invoices', ['customerId', 'status']);
  await queryInterface.addIndex('invoices', ['subscriptionId']);

  // 19. invoice_lines
  await queryInterface.createTable('invoice_lines', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    invoiceId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'invoices', key: 'id' },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
    },
    variantId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'product_variants', key: 'id' },
    },
    description: { type: DataTypes.STRING(255), allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    discountAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    taxId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'taxes', key: 'id' },
    },
    taxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    taxAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    lineTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('invoice_lines', ['invoiceId']);

  // 20. payments
  await queryInterface.createTable('payments', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    invoiceId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'invoices', key: 'id' },
      onDelete: 'CASCADE',
    },
    method: { type: DataTypes.ENUM(PAYMENT_METHODS), allowNull: false, defaultValue: 'bank_transfer' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    paidOn: { type: DataTypes.DATEONLY, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
    recordedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('payments', ['invoiceId']);
  await queryInterface.addIndex('payments', ['paidOn']);
  await queryInterface.addIndex('payments', ['recordedBy']);
};

export const down = async ({ context: queryInterface }) => {
  // Drop tables in strict reverse dependency order
  await queryInterface.dropTable('payments');
  await queryInterface.dropTable('invoice_lines');
  await queryInterface.dropTable('invoices');
  await queryInterface.dropTable('subscription_discounts');
  await queryInterface.dropTable('subscription_lines');
  await queryInterface.dropTable('subscriptions');
  await queryInterface.dropTable('discount_products');
  await queryInterface.dropTable('discounts');
  await queryInterface.dropTable('template_lines');
  await queryInterface.dropTable('quotation_templates');
  await queryInterface.dropTable('payment_terms');
  await queryInterface.dropTable('taxes');
  await queryInterface.dropTable('plans');
  await queryInterface.dropTable('product_variants');
  await queryInterface.dropTable('products');
  await queryInterface.dropTable('sequences');
  await queryInterface.dropTable('audit_logs');
  await queryInterface.dropTable('customers');
  await queryInterface.dropTable('refresh_tokens');
  await queryInterface.dropTable('users');
};

