import { Router } from 'express';
import * as portalController from '../../controllers/portal.controller.js';

const router = Router();

router.get('/', portalController.listPlans);

export default router;

