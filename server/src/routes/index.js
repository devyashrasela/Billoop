import { Router } from 'express';

// ── Person A routes ──
import authRoutes from './auth.js';
import staffRoutes from './ops/staff.js';
import billingRoutes from './ops/billing.js';

// ── Person B routes ──
// (Person B mounts catalog, customer, and transaction routes here)

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Person A mounts ──
router.use('/auth', authRoutes);
router.use('/ops/staff', staffRoutes);
router.use('/ops/billing', billingRoutes);

// ── Person B mounts ──

export default router;
