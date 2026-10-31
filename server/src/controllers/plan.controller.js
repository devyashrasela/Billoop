import { asyncHandler } from '../utils/asyncHandler.js';
import * as planService from '../services/plan.service.js';

export const listPlans = asyncHandler(async (req, res) => {
  const result = await planService.listPlans(req.query);
  res.json(result);
});

export const getPlan = asyncHandler(async (req, res) => {
  const plan = await planService.getPlanById(req.params.id);
  res.json({ data: plan });
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await planService.createPlan(req.body);
  res.status(201).json({ data: plan });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await planService.updatePlan(req.params.id, req.body);
  res.json({ data: plan });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const result = await planService.deletePlan(req.params.id);
  res.json(result);
});
