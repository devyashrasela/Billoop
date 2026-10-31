import * as paymentService from '../services/payment.service.js';

export const recordPayment = async (req, res, next) => {
  try {
    const actorId = req.user?.id || 1; // Default to authenticated user or fallback for system
    const result = await paymentService.recordPayment(req.params.id, req.body, actorId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const listPayments = async (req, res, next) => {
  try {
    const result = await paymentService.listPayments(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
