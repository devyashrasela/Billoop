import * as subscriptionService from '../services/subscription.service.js';

export const listSubscriptions = async (req, res, next) => {
  try {
    const result = await subscriptionService.listSubscriptions(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const subscription = await subscriptionService.createSubscription(req.body, actorId);
    res.status(201).json(subscription);
  } catch (err) {
    next(err);
  }
};

export const createFromTemplate = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const { templateId } = req.params;
    const { customerId, startDate } = req.body;
    const subscription = await subscriptionService.createFromTemplate(templateId, customerId, startDate, actorId);
    res.status(201).json(subscription);
  } catch (err) {
    next(err);
  }
};

export const transitionSubscription = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const { id } = req.params;
    const { to, closeReason } = req.body;
    const subscription = await subscriptionService.transitionSubscription(id, to, closeReason, actorId);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};

export const pauseSubscription = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const subscription = await subscriptionService.pauseSubscription(req.params.id, actorId);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};

export const resumeSubscription = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const subscription = await subscriptionService.resumeSubscription(req.params.id, actorId);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};

export const renewSubscription = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const subscription = await subscriptionService.renewSubscription(req.params.id, actorId);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};

export const closeSubscription = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const { reason } = req.body;
    const subscription = await subscriptionService.closeSubscription(req.params.id, reason, actorId);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};
