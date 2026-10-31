import { ApiError } from '../utils/ApiError.js';

/**
 * Zod validation middleware factory.
 * Accepts a Zod schema or an object with schemas for body, query, and/or params.
 *
 * Example usage:
 *   validate({ body: registerSchema })
 *   validate({ query: paginationSchema, params: idSchema })
 *
 * @param {Object} schemas
 * @param {import('zod').ZodType} [schemas.body]
 * @param {import('zod').ZodType} [schemas.query]
 * @param {import('zod').ZodType} [schemas.params]
 */
export const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      const fieldErrors = {};

      if (schemas.body && req.body !== undefined) {
        const result = await schemas.body.safeParseAsync(req.body);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const field = issue.path.join('.') || 'body';
            fieldErrors[field] = issue.message;
          });
        } else {
          req.body = result.data;
        }
      }

      if (schemas.query && req.query !== undefined) {
        const result = await schemas.query.safeParseAsync(req.query);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const field = issue.path.join('.') || 'query';
            fieldErrors[field] = issue.message;
          });
        } else {
          req.query = result.data;
        }
      }

      if (schemas.params && req.params !== undefined) {
        const result = await schemas.params.safeParseAsync(req.params);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const field = issue.path.join('.') || 'params';
            fieldErrors[field] = issue.message;
          });
        } else {
          req.params = result.data;
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError(422, 'Validation failed', fieldErrors);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
