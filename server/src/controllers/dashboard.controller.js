import * as dashboardService from '../services/dashboard.service.js';

export const getDashboardSummary = async (req, res) => {
  const result = await dashboardService.getDashboardSummary();
  res.status(200).json(result);
};
