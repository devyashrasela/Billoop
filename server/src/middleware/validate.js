import { ApiError } from '../utils/ApiError.js';

const setRequestProperty = (req, prop, value) => {
  try {
    req[prop] = value;
  } catch {
    Object.defineProperty(req, prop, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
};

/**
 * Zod validation middleware factory.
 * Accepts either:
 * 1. An object of schemas: { body?: ZodType, query?: ZodType, params?: ZodType }
 * 2. A single composite Zod schema: z.object({ body?: ..., query?: ..., params?: ... })
 *
 * @param {Object|import('zod').ZodType} schemas
 */
export const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      // Case 1: schemas is an instance of a Zod schema
      if (schemas && typeof schemas.parseAsync === 'function') {
        const parsed = await schemas.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });

        if (parsed.body !== undefined) setRequestProperty(req, 'body', parsed.body);
        if (parsed.query !== undefined) setRequestProperty(req, 'query', parsed.query);
        if (parsed.params !== undefined) setRequestProperty(req, 'params', parsed.params);

        return next();
      }

      // Case 2: schemas is an object { body?, query?, params? }
      const fieldErrors = {};

      if (schemas.body && req.body !== undefined) {
        const result = await schemas.body.safeParseAsync(req.body);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const field = issue.path.join('.') || 'body';
            fieldErrors[field] = issue.message;
          });
        } else {
          setRequestProperty(req, 'body', result.data);
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
          setRequestProperty(req, 'query', result.data);
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
          setRequestProperty(req, 'params', result.data);
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError(422, 'Validation failed', fieldErrors);
      }

      next();
    } catch (err) {
      if (err.name === 'ZodError' && err.issues) {
        const fieldErrors = {};
        for (const issue of err.issues) {
          const key = issue.path.slice(1).join('.') || issue.path.join('.');
          fieldErrors[key] = issue.message;
        }
        return next(new ApiError(422, 'Validation failed', fieldErrors));
      }
      next(err);
    }
  };
};
