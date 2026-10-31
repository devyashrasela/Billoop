import { asyncHandler } from '../utils/asyncHandler.js';
import * as templateService from '../services/template.service.js';

export const listTemplates = asyncHandler(async (req, res) => {
  const result = await templateService.listTemplates(req.query);
  res.json(result);
});

export const getTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplateById(req.params.id);
  res.json({ data: template });
});

export const createTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.createTemplate(req.body);
  res.status(201).json({ data: template });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.updateTemplate(req.params.id, req.body);
  res.json({ data: template });
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const result = await templateService.deleteTemplate(req.params.id);
  res.json(result);
});
