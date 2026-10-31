import { Router } from 'express';
import * as customerController from '../../controllers/customer.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
} from '../../validators/customer.validator.js';

const router = Router();

router.get('/', customerController.listCustomers);
router.get('/:id', validate(customerIdParamSchema), customerController.getCustomer);
router.post('/', validate(createCustomerSchema), customerController.createCustomer);
router.put('/:id', validate(updateCustomerSchema), customerController.updateCustomer);

export default router;

