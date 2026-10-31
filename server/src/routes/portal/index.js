import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import meRoutes from './me.js';
import subscriptionRoutes from './subscriptions.js';
import invoiceRoutes from './invoices.js';
import planRoutes from './plans.js';

const router = Router();

// Secure all portal endpoints behind authentication and customer/admin role
router.use(authenticate);
router.use(authorize('customer', 'admin'));

router.use('/me', meRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/plans', planRoutes);

export default router;

