import { asyncHandler } from '../utils/asyncHandler.js';
import * as discountService from '../services/discount.service.js';

export const listDiscounts = asyncHandler(async (req, res) => {
  const result = await discountService.listDiscounts(req.query);
  res.json(result);
});

export const getDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.getDiscountById(req.params.id);
  res.json({ data: discount });
});

export const createDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.createDiscount(req.body);
  res.status(201).json({ data: discount });
});

export const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.updateDiscount(req.params.id, req.body);
  res.json({ data: discount });
});

export const deleteDiscount = asyncHandler(async (req, res) => {
  const result = await discountService.deleteDiscount(req.params.id);
  res.json(result);
});
