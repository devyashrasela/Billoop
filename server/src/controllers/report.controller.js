import * as reportService from '../services/report.service.js';

export const getRevenueReport = async (req, res) => {
  const months = Number(req.query.months) || 6;
  const trend = await reportService.getMonthlyRevenueTrend({ months });
  const paymentMethods = await reportService.getPaymentMethodBreakdown();

  res.status(200).json({
    trend,
    paymentMethods,
  });
};

export const getSubscriptionGrowthReport = async (req, res) => {
  const months = Number(req.query.months) || 6;
  const growth = await reportService.getSubscriptionGrowthReport({ months });
  res.status(200).json({ growth });
};

export const getAgingInvoicesReport = async (req, res) => {
  const aging = await reportService.getAgingInvoicesReport();
  res.status(200).json({ aging });
};
