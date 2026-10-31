import { Router } from 'express';
import * as portalController from '../../controllers/portal.controller.js';
import { validate } from '../../middleware/validate.js';
import { portalIdParamSchema } from '../../validators/portal.validator.js';

const router = Router();

router.get('/', portalController.listInvoices);
router.get('/:id', validate(portalIdParamSchema), portalController.getInvoice);
router.get('/:id/print', validate(portalIdParamSchema), portalController.printInvoice);

export default router;

