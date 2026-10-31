import { Router } from 'express';
import * as templateController from '../../controllers/template.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  templateIdParamSchema,
} from '../../validators/template.validator.js';

const router = Router();

router.get('/', templateController.listTemplates);
router.get('/:id', validate(templateIdParamSchema), templateController.getTemplate);
router.post('/', validate(createTemplateSchema), templateController.createTemplate);
router.put('/:id', validate(updateTemplateSchema), templateController.updateTemplate);
router.delete('/:id', validate(templateIdParamSchema), templateController.deleteTemplate);

export default router;
