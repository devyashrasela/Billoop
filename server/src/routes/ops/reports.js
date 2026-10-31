import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../../../shared/constants/index.js';
import * as reportController from '../../controllers/report.controller.js';

const router = Router();

// Staff and Admin can view reports
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.STAFF));

router.get('/revenue', asyncHandler(reportController.getRevenueReport));
router.get('/growth', asyncHandler(reportController.getSubscriptionGrowthReport));
router.get('/aging', asyncHandler(reportController.getAgingInvoicesReport));

export default router;
