import { asyncHandler } from '../utils/asyncHandler.js';
import * as paymentTermService from '../services/paymentTerm.service.js';

export const listPaymentTerms = asyncHandler(async (req, res) => {
  const result = await paymentTermService.listPaymentTerms(req.query);
  res.json(result);
});

export const getPaymentTerm = asyncHandler(async (req, res) => {
  const term = await paymentTermService.getPaymentTermById(req.params.id);
  res.json({ data: term });
});

export const createPaymentTerm = asyncHandler(async (req, res) => {
  const term = await paymentTermService.createPaymentTerm(req.body);
  res.status(201).json({ data: term });
});

export const updatePaymentTerm = asyncHandler(async (req, res) => {
  const term = await paymentTermService.updatePaymentTerm(req.params.id, req.body);
  res.json({ data: term });
});

export const deletePaymentTerm = asyncHandler(async (req, res) => {
  const result = await paymentTermService.deletePaymentTerm(req.params.id);
  res.json(result);
});
