import { Router } from 'express';

// ── Person A routes ──
import authRoutes from './auth.js';
import staffRoutes from './ops/staff.js';

// ── Person B routes ──
// (Person B mounts catalog, customer, and transaction routes here)

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Person A mounts ──
router.use('/auth', authRoutes);
router.use('/ops/staff', staffRoutes);

// ── Person B mounts ──

export default router;
