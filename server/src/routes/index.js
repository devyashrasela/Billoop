import { Router } from 'express';

// ── Person A routes ──
import authRoutes from './auth.js';
import staffRoutes from './ops/staff.js';

// ── Person B routes ──
import taxRoutes from './ops/taxes.js';
import paymentTermRoutes from './ops/paymentTerms.js';
import productRoutes from './ops/products.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Person A mounts ──
router.use('/auth', authRoutes);
router.use('/ops/staff', staffRoutes);

// ── Person B mounts ──
router.use('/ops/taxes', taxRoutes);
router.use('/ops/payment-terms', paymentTermRoutes);
router.use('/ops/products', productRoutes);

export default router;
