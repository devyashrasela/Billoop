import { Router } from 'express';
import * as subscriptionController from '../../controllers/subscription.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  subscriptionIdParamSchema,
  createSubscriptionSchema,
  createFromTemplateSchema,
  transitionSubscriptionSchema,
  closeSubscriptionSchema,
} from '../../validators/subscription.validator.js';

const router = Router();

router.get('/', subscriptionController.listSubscriptions);
router.post('/', validate(createSubscriptionSchema), subscriptionController.createSubscription);
router.post('/from-template/:templateId', validate(createFromTemplateSchema), subscriptionController.createFromTemplate);

router.get('/:id', validate(subscriptionIdParamSchema), subscriptionController.getSubscription);
router.post('/:id/transition', validate(transitionSubscriptionSchema), subscriptionController.transitionSubscription);
router.post('/:id/pause', validate(subscriptionIdParamSchema), subscriptionController.pauseSubscription);
router.post('/:id/resume', validate(subscriptionIdParamSchema), subscriptionController.resumeSubscription);
router.post('/:id/renew', validate(subscriptionIdParamSchema), subscriptionController.renewSubscription);
router.post('/:id/close', validate(closeSubscriptionSchema), subscriptionController.closeSubscription);

export default router;
