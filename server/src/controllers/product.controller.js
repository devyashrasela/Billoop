import { asyncHandler } from '../utils/asyncHandler.js';
import * as productService from '../services/product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);
  res.json(result);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json({ data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json({ data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  res.json(result);
});

export const addVariant = asyncHandler(async (req, res) => {
  const variant = await productService.addVariant(req.params.id, req.body);
  res.status(201).json({ data: variant });
});

export const deleteVariant = asyncHandler(async (req, res) => {
  const result = await productService.deleteVariant(req.params.id, req.params.variantId);
  res.json(result);
});
