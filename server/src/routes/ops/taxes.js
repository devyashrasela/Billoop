import { Router } from 'express';
import * as taxController from '../../controllers/tax.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createTaxSchema,
  updateTaxSchema,
  taxIdParamSchema,
} from '../../validators/tax.validator.js';

const router = Router();

router.get('/', taxController.listTaxes);
router.get('/:id', validate(taxIdParamSchema), taxController.getTax);
router.post('/', validate(createTaxSchema), taxController.createTax);
router.put('/:id', validate(updateTaxSchema), taxController.updateTax);
router.delete('/:id', validate(taxIdParamSchema), taxController.deleteTax);

export default router;

