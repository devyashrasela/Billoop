import { Router } from 'express';
import * as paymentTermController from '../../controllers/paymentTerm.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createPaymentTermSchema,
  updatePaymentTermSchema,
  paymentTermIdParamSchema,
} from '../../validators/paymentTerm.validator.js';

const router = Router();

router.get('/', paymentTermController.listPaymentTerms);
router.get('/:id', validate(paymentTermIdParamSchema), paymentTermController.getPaymentTerm);
router.post('/', validate(createPaymentTermSchema), paymentTermController.createPaymentTerm);
router.put('/:id', validate(updatePaymentTermSchema), paymentTermController.updatePaymentTerm);
router.delete('/:id', validate(paymentTermIdParamSchema), paymentTermController.deletePaymentTerm);

export default router;

