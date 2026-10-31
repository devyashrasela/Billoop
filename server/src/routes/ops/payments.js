import { Router } from 'express';
import * as paymentController from '../../controllers/payment.controller.js';
import { validate } from '../../middleware/validate.js';
import { listPaymentsQuerySchema } from '../../validators/payment.validator.js';

const router = Router();

router.get('/', validate(listPaymentsQuerySchema), paymentController.listPayments);

export default router;
