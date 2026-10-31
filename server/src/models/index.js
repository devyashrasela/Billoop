import { sequelize } from '../config/db.js';

// ── Identity & Core models (Person A) ──
import { User } from './User.js';
import { RefreshToken } from './RefreshToken.js';
import { Customer } from './Customer.js';
import { AuditLog } from './AuditLog.js';
import { Sequence } from './Sequence.js';

// ── Catalog models ──
import { Product } from './Product.js';
import { ProductVariant } from './ProductVariant.js';
import { Plan } from './Plan.js';
import { Tax } from './Tax.js';
import { PaymentTerm } from './PaymentTerm.js';
import { QuotationTemplate } from './QuotationTemplate.js';
import { TemplateLine } from './TemplateLine.js';

// ── Discount models ──
import { Discount } from './Discount.js';
import { DiscountProduct } from './DiscountProduct.js';
import { SubscriptionDiscount } from './SubscriptionDiscount.js';

// ── Transaction models ──
import { Subscription } from './Subscription.js';
import { SubscriptionLine } from './SubscriptionLine.js';
import { Invoice } from './Invoice.js';
import { InvoiceLine } from './InvoiceLine.js';
import { Payment } from './Payment.js';

// ── Associations ──

// Identity & Users
User.hasOne(Customer, { foreignKey: 'userId', as: 'customer' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'actorId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

User.hasMany(Subscription, { foreignKey: 'createdBy', as: 'createdSubscriptions' });
Subscription.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Payment, { foreignKey: 'recordedBy', as: 'recordedPayments' });
Payment.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

// Catalog & Variants
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Templates & Plans
Plan.hasMany(QuotationTemplate, { foreignKey: 'planId', as: 'templates' });
QuotationTemplate.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

PaymentTerm.hasMany(QuotationTemplate, { foreignKey: 'paymentTermId', as: 'templates' });
QuotationTemplate.belongsTo(PaymentTerm, { foreignKey: 'paymentTermId', as: 'paymentTerm' });

QuotationTemplate.hasMany(TemplateLine, { foreignKey: 'templateId', as: 'lines' });
TemplateLine.belongsTo(QuotationTemplate, { foreignKey: 'templateId', as: 'template' });

Product.hasMany(TemplateLine, { foreignKey: 'productId', as: 'templateLines' });
TemplateLine.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

ProductVariant.hasMany(TemplateLine, { foreignKey: 'variantId', as: 'templateLines' });
TemplateLine.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });

Tax.hasMany(TemplateLine, { foreignKey: 'taxId', as: 'templateLines' });
TemplateLine.belongsTo(Tax, { foreignKey: 'taxId', as: 'tax' });

// Discounts
Discount.belongsToMany(Product, {
  through: DiscountProduct,
  foreignKey: 'discountId',
  otherKey: 'productId',
  as: 'products',
});
Product.belongsToMany(Discount, {
  through: DiscountProduct,
  foreignKey: 'productId',
  otherKey: 'discountId',
  as: 'discounts',
});

Discount.hasMany(DiscountProduct, { foreignKey: 'discountId', as: 'discountProducts' });
DiscountProduct.belongsTo(Discount, { foreignKey: 'discountId', as: 'discount' });
Product.hasMany(DiscountProduct, { foreignKey: 'productId', as: 'discountProducts' });
DiscountProduct.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Discount.belongsToMany(Subscription, {
  through: SubscriptionDiscount,
  foreignKey: 'discountId',
  otherKey: 'subscriptionId',
  as: 'subscriptions',
});
Subscription.belongsToMany(Discount, {
  through: SubscriptionDiscount,
  foreignKey: 'subscriptionId',
  otherKey: 'discountId',
  as: 'discounts',
});

Discount.hasMany(SubscriptionDiscount, { foreignKey: 'discountId', as: 'subscriptionDiscounts' });
SubscriptionDiscount.belongsTo(Discount, { foreignKey: 'discountId', as: 'discount' });
Subscription.hasMany(SubscriptionDiscount, { foreignKey: 'subscriptionId', as: 'subscriptionDiscounts' });
SubscriptionDiscount.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Subscriptions
Customer.hasMany(Subscription, { foreignKey: 'customerId', as: 'subscriptions' });
Subscription.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Plan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

QuotationTemplate.hasMany(Subscription, { foreignKey: 'templateId', as: 'subscriptions' });
Subscription.belongsTo(QuotationTemplate, { foreignKey: 'templateId', as: 'template' });

PaymentTerm.hasMany(Subscription, { foreignKey: 'paymentTermId', as: 'subscriptions' });
Subscription.belongsTo(PaymentTerm, { foreignKey: 'paymentTermId', as: 'paymentTerm' });

Subscription.hasMany(SubscriptionLine, { foreignKey: 'subscriptionId', as: 'lines' });
SubscriptionLine.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

Product.hasMany(SubscriptionLine, { foreignKey: 'productId', as: 'subscriptionLines' });
SubscriptionLine.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

ProductVariant.hasMany(SubscriptionLine, { foreignKey: 'variantId', as: 'subscriptionLines' });
SubscriptionLine.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });

Tax.hasMany(SubscriptionLine, { foreignKey: 'taxId', as: 'subscriptionLines' });
SubscriptionLine.belongsTo(Tax, { foreignKey: 'taxId', as: 'tax' });

// Invoices
Subscription.hasMany(Invoice, { foreignKey: 'subscriptionId', as: 'invoices' });
Invoice.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Invoice.hasMany(InvoiceLine, { foreignKey: 'invoiceId', as: 'lines' });
InvoiceLine.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

Product.hasMany(InvoiceLine, { foreignKey: 'productId', as: 'invoiceLines' });
InvoiceLine.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

ProductVariant.hasMany(InvoiceLine, { foreignKey: 'variantId', as: 'invoiceLines' });
InvoiceLine.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });

Tax.hasMany(InvoiceLine, { foreignKey: 'taxId', as: 'invoiceLines' });
InvoiceLine.belongsTo(Tax, { foreignKey: 'taxId', as: 'tax' });

// Payments
Invoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

export {
  sequelize,
  User,
  RefreshToken,
  Customer,
  AuditLog,
  Sequence,
  Product,
  ProductVariant,
  Plan,
  Tax,
  PaymentTerm,
  QuotationTemplate,
  TemplateLine,
  Discount,
  DiscountProduct,
  SubscriptionDiscount,
  Subscription,
  SubscriptionLine,
  Invoice,
  InvoiceLine,
  Payment,
};
