import { Router } from 'express';
import * as productController from '../../controllers/product.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  createVariantSchema,
} from '../../validators/product.validator.js';

const router = Router();

router.get('/', productController.listProducts);
router.get('/:id', validate(productIdParamSchema), productController.getProduct);
router.post('/', validate(createProductSchema), productController.createProduct);
router.put('/:id', validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', validate(productIdParamSchema), productController.deleteProduct);

// Variant sub-resources
router.post('/:id/variants', validate(createVariantSchema), productController.addVariant);
router.delete('/:id/variants/:variantId', productController.deleteVariant);

export default router;
