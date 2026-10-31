import { Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import { QuotationTemplate } from '../models/QuotationTemplate.js';
import { TemplateLine } from '../models/TemplateLine.js';
import { Plan } from '../models/Plan.js';
import { PaymentTerm } from '../models/PaymentTerm.js';
import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { Tax } from '../models/Tax.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';

export const listTemplates = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.isActive !== undefined && query.isActive !== '') {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.planId) {
    where.planId = query.planId;
  }

  if (query.q) {
    where.name = { [Op.like]: `%${query.q}%` };
  }

  const { rows, count } = await QuotationTemplate.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: Plan, as: 'plan' },
      { model: PaymentTerm, as: 'paymentTerm' },
      {
        model: TemplateLine,
        as: 'lines',
        include: [
          { model: Product, as: 'product' },
          { model: ProductVariant, as: 'variant' },
          { model: Tax, as: 'tax' },
        ],
      },
    ],
    distinct: true,
    order: [['createdAt', 'DESC']],
  });

  return {
    data: rows,
    meta: paginationMeta(count, page, limit),
  };
};

export const getTemplateById = async (id) => {
  const template = await QuotationTemplate.findByPk(id, {
    include: [
      { model: Plan, as: 'plan' },
      { model: PaymentTerm, as: 'paymentTerm' },
      {
        model: TemplateLine,
        as: 'lines',
        include: [
          { model: Product, as: 'product' },
          { model: ProductVariant, as: 'variant' },
          { model: Tax, as: 'tax' },
        ],
      },
    ],
  });
  if (!template) throw new ApiError(404, 'Quotation template not found');
  return template;
};

export const createTemplate = async (data) => {
  const { lines = [], ...templateData } = data;

  const plan = await Plan.findByPk(templateData.planId);
  if (!plan) throw new ApiError(404, 'Associated plan not found');

  if (templateData.paymentTermId) {
    const term = await PaymentTerm.findByPk(templateData.paymentTermId);
    if (!term) throw new ApiError(404, 'Associated payment term not found');
  }

  const createdTemplate = await sequelize.transaction(async (t) => {
    const template = await QuotationTemplate.create(templateData, { transaction: t });

    const lineRecords = lines.map((l) => ({
      templateId: template.id,
      productId: l.productId,
      variantId: l.variantId || null,
      qty: l.qty,
      unitPrice: l.unitPrice !== undefined ? l.unitPrice : null,
      taxId: l.taxId || null,
    }));

    await TemplateLine.bulkCreate(lineRecords, { transaction: t });

    return template;
  });

  return getTemplateById(createdTemplate.id);
};

export const updateTemplate = async (id, data) => {
  const template = await getTemplateById(id);
  const { lines, ...templateData } = data;

  if (templateData.planId) {
    const plan = await Plan.findByPk(templateData.planId);
    if (!plan) throw new ApiError(404, 'Associated plan not found');
  }

  if (templateData.paymentTermId) {
    const term = await PaymentTerm.findByPk(templateData.paymentTermId);
    if (!term) throw new ApiError(404, 'Associated payment term not found');
  }

  await sequelize.transaction(async (t) => {
    await template.update(templateData, { transaction: t });

    if (lines !== undefined) {
      await TemplateLine.destroy({ where: { templateId: id }, transaction: t });
      const lineRecords = lines.map((l) => ({
        templateId: id,
        productId: l.productId,
        variantId: l.variantId || null,
        qty: l.qty,
        unitPrice: l.unitPrice !== undefined ? l.unitPrice : null,
        taxId: l.taxId || null,
      }));
      await TemplateLine.bulkCreate(lineRecords, { transaction: t });
    }
  });

  return getTemplateById(id);
};

export const deleteTemplate = async (id) => {
  const template = await getTemplateById(id);
  await template.destroy();
  return { id, message: 'Quotation template deleted successfully' };
};
