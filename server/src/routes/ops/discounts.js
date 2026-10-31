import { Router } from 'express';
import * as discountController from '../../controllers/discount.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createDiscountSchema,
  updateDiscountSchema,
  discountIdParamSchema,
} from '../../validators/discount.validator.js';

const router = Router();

router.get('/', discountController.listDiscounts);
router.get('/:id', validate(discountIdParamSchema), discountController.getDiscount);
router.post('/', validate(createDiscountSchema), discountController.createDiscount);
router.put('/:id', validate(updateDiscountSchema), discountController.updateDiscount);
router.delete('/:id', validate(discountIdParamSchema), discountController.deleteDiscount);

export default router;
