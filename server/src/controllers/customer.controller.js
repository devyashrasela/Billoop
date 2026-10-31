import { asyncHandler } from '../utils/asyncHandler.js';
import * as customerService from '../services/customer.service.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  res.json(result);
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.json({ data: customer });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(201).json({ data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  res.json({ data: customer });
});

