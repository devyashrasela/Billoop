import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../../../shared/constants/index.js';
import * as dashboardController from '../../controllers/dashboard.controller.js';

const router = Router();

// Staff and Admin can view the dashboard
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.STAFF));

router.get('/summary', asyncHandler(dashboardController.getDashboardSummary));

export default router;
