import { Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';

export const listProducts = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.type) {
    where.type = query.type;
  }

  if (query.isActive !== undefined && query.isActive !== '') {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.q) {
    where.name = { [Op.like]: `%${query.q}%` };
  }

  const { rows, count } = await Product.findAndCountAll({
    where,
    limit,
    offset,
    include: [{ model: ProductVariant, as: 'variants' }],
    distinct: true,
    order: [['createdAt', 'DESC']],
  });

  return {
    data: rows,
    meta: paginationMeta(count, page, limit),
  };
};

export const getProductById = async (id) => {
  const product = await Product.findByPk(id, {
    include: [{ model: ProductVariant, as: 'variants' }],
  });
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

export const createProduct = async (data) => {
  const { variants = [], ...productData } = data;

  const existing = await Product.findOne({ where: { name: productData.name } });
  if (existing) {
    throw new ApiError(409, 'A product with this name already exists', {
      name: 'Product name must be unique',
    });
  }

  const product = await sequelize.transaction(async (t) => {
    const p = await Product.create(productData, { transaction: t });

    if (variants.length > 0) {
      const variantRecords = variants.map((v) => ({
        ...v,
        productId: p.id,
      }));
      await ProductVariant.bulkCreate(variantRecords, { transaction: t });
    }

    return p;
  });

  return getProductById(product.id);
};

export const updateProduct = async (id, data) => {
  const product = await getProductById(id);
  const { variants, ...productData } = data;

  if (productData.name && productData.name !== product.name) {
    const existing = await Product.findOne({
      where: { name: productData.name, id: { [Op.ne]: id } },
    });
    if (existing) {
      throw new ApiError(409, 'A product with this name already exists', {
        name: 'Product name must be unique',
      });
    }
  }

  await sequelize.transaction(async (t) => {
    await product.update(productData, { transaction: t });

    if (variants !== undefined) {
      // Synchronize variants: replace or update
      await ProductVariant.destroy({ where: { productId: id }, transaction: t });
      if (variants.length > 0) {
        const variantRecords = variants.map((v) => ({
          ...v,
          productId: id,
        }));
        await ProductVariant.bulkCreate(variantRecords, { transaction: t });
      }
    }
  });

  return getProductById(id);
};

export const deleteProduct = async (id) => {
  const product = await getProductById(id);
  await product.destroy(); // Soft delete
  return { id, message: 'Product deleted successfully' };
};

// ── Variant sub-resource operations ──

export const addVariant = async (productId, data) => {
  await getProductById(productId);

  const existing = await ProductVariant.findOne({
    where: {
      productId,
      attribute: data.attribute,
      value: data.value,
    },
  });

  if (existing) {
    throw new ApiError(409, `Variant '${data.attribute}: ${data.value}' already exists for this product`, {
      value: 'Variant with this attribute and value already exists',
    });
  }

  return ProductVariant.create({
    ...data,
    productId,
  });
};

export const deleteVariant = async (productId, variantId) => {
  const variant = await ProductVariant.findOne({
    where: { id: variantId, productId },
  });
  if (!variant) throw new ApiError(404, 'Variant not found for this product');

  await variant.destroy();
  return { id: variantId, message: 'Variant deleted successfully' };
};
