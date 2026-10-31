import * as staffService from '../services/staff.service.js';

export const listStaff = async (req, res) => {
  const result = await staffService.listStaff(req.query);
  res.status(200).json(result);
};

export const createStaff = async (req, res) => {
  const result = await staffService.createStaff(req.body);
  res.status(201).json(result);
};

export const updateStaff = async (req, res) => {
  const result = await staffService.updateStaff(req.params.id, req.body);
  res.status(200).json(result);
};

export const deactivateStaff = async (req, res) => {
  const result = await staffService.deactivateStaff(req.params.id, req.user.id);
  res.status(200).json({ message: 'Staff member deactivated successfully', staff: result });
};
