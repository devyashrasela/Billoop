import { Router } from 'express';
import * as portalController from '../../controllers/portal.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  portalIdParamSchema,
  portalCloseSubSchema,
} from '../../validators/portal.validator.js';

const router = Router();

router.get('/', portalController.listSubscriptions);
router.get('/:id', validate(portalIdParamSchema), portalController.getSubscription);
router.post('/:id/pause', validate(portalIdParamSchema), portalController.pauseSubscription);
router.post('/:id/resume', validate(portalIdParamSchema), portalController.resumeSubscription);
router.post('/:id/renew', validate(portalIdParamSchema), portalController.renewSubscription);
router.post('/:id/close', validate(portalCloseSubSchema), portalController.closeSubscription);

export default router;

