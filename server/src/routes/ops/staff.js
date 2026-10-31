import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../../../shared/constants/index.js';
import * as staffController from '../../controllers/staff.controller.js';
import { staffCreateSchema, staffUpdateSchema } from '../../validators/auth.validator.js';

const router = Router();

// All staff management routes require active admin authentication
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', asyncHandler(staffController.listStaff));

router.post(
  '/',
  validate({ body: staffCreateSchema }),
  asyncHandler(staffController.createStaff)
);

router.patch(
  '/:id',
  validate({ body: staffUpdateSchema }),
  asyncHandler(staffController.updateStaff)
);

router.delete('/:id', asyncHandler(staffController.deactivateStaff));

export default router;
