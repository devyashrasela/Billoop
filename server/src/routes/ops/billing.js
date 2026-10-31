import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../../../shared/constants/index.js';
import { runBillingSweep, toDateString } from '../../services/billing.service.js';

const router = Router();

// Staff and Admin can trigger on-demand billing runs
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.STAFF));

router.post(
  '/run-now',
  asyncHandler(async (req, res) => {
    const todayStr = req.body?.date || toDateString(new Date());
    const result = await runBillingSweep({ todayStr });
    res.status(200).json({
      message: 'Billing sweep completed.',
      result,
    });
  })
);

export default router;
