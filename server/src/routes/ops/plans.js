import { Router } from 'express';
import * as planController from '../../controllers/plan.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
} from '../../validators/plan.validator.js';

const router = Router();

router.get('/', planController.listPlans);
router.get('/:id', validate(planIdParamSchema), planController.getPlan);
router.post('/', validate(createPlanSchema), planController.createPlan);
router.put('/:id', validate(updatePlanSchema), planController.updatePlan);
router.delete('/:id', validate(planIdParamSchema), planController.deletePlan);

export default router;
