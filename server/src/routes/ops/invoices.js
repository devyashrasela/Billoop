import { Router } from 'express';
import * as invoiceController from '../../controllers/invoice.controller.js';
import * as paymentController from '../../controllers/payment.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  invoiceIdParamSchema,
  cancelInvoiceSchema,
  listInvoicesQuerySchema,
} from '../../validators/invoice.validator.js';
import { createPaymentSchema } from '../../validators/payment.validator.js';

const router = Router();

router.get('/', validate(listInvoicesQuerySchema), invoiceController.listInvoices);
router.get('/:id', validate(invoiceIdParamSchema), invoiceController.getInvoice);
router.post('/:id/confirm', validate(invoiceIdParamSchema), invoiceController.confirmInvoice);
router.post('/:id/cancel', validate(cancelInvoiceSchema), invoiceController.cancelInvoice);
router.get('/:id/print', validate(invoiceIdParamSchema), invoiceController.printInvoice);

// Nested payment recording endpoint: POST /api/ops/invoices/:id/payments
router.post('/:id/payments', validate(createPaymentSchema), paymentController.recordPayment);

export default router;
