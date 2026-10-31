import { Router } from 'express';

// ── Person A routes ──
// (Mounted as auth, staff, billing, etc. in their milestones)

// ── Person B routes ──
import taxRoutes from './ops/taxes.js';
import paymentTermRoutes from './ops/paymentTerms.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Person B Catalog Ops Routes ──
router.use('/ops/taxes', taxRoutes);
router.use('/ops/payment-terms', paymentTermRoutes);

export default router;
