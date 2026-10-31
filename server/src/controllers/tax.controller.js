import { asyncHandler } from '../utils/asyncHandler.js';
import * as taxService from '../services/tax.service.js';

export const listTaxes = asyncHandler(async (req, res) => {
  const result = await taxService.listTaxes(req.query);
  res.json(result);
});

export const getTax = asyncHandler(async (req, res) => {
  const tax = await taxService.getTaxById(req.params.id);
  res.json({ data: tax });
});

export const createTax = asyncHandler(async (req, res) => {
  const tax = await taxService.createTax(req.body);
  res.status(201).json({ data: tax });
});

export const updateTax = asyncHandler(async (req, res) => {
  const tax = await taxService.updateTax(req.params.id, req.body);
  res.json({ data: tax });
});

export const deleteTax = asyncHandler(async (req, res) => {
  const result = await taxService.deleteTax(req.params.id);
  res.json(result);
});
