import { Router } from 'express';

// ── Person A routes ──
import authRoutes from './auth.js';
import staffRoutes from './ops/staff.js';
import billingRoutes from './ops/billing.js';
import dashboardRoutes from './ops/dashboard.js';
import reportRoutes from './ops/reports.js';

// ── Person B routes ──
import taxRoutes from './ops/taxes.js';
import paymentTermRoutes from './ops/paymentTerms.js';
import productRoutes from './ops/products.js';
import planRoutes from './ops/plans.js';
import discountRoutes from './ops/discounts.js';
import templateRoutes from './ops/templates.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Person A mounts ──
router.use('/auth', authRoutes);
router.use('/ops/staff', staffRoutes);
router.use('/ops/billing', billingRoutes);
router.use('/ops/dashboard', dashboardRoutes);
router.use('/ops/reports', reportRoutes);

// ── Person B mounts ──
router.use('/ops/taxes', taxRoutes);
router.use('/ops/payment-terms', paymentTermRoutes);
router.use('/ops/products', productRoutes);
router.use('/ops/plans', planRoutes);
router.use('/ops/discounts', discountRoutes);
router.use('/ops/templates', templateRoutes);

export default router;
