import { Router } from 'express';
import * as portalController from '../../controllers/portal.controller.js';
import { validate } from '../../middleware/validate.js';
import { updatePortalProfileSchema } from '../../validators/portal.validator.js';

const router = Router();

router.get('/', portalController.getProfile);
router.put('/', validate(updatePortalProfileSchema), portalController.updateProfile);

export default router;

