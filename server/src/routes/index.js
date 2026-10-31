import { Router } from 'express';
const router = Router();

router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
// mount /auth, /portal, /ops here in later milestones

export default router;

