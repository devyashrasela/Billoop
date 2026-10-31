import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors = {};
      for (const issue of err.issues) {
        // Path might be ['body', 'name'] -> extract field name
        const key = issue.path.slice(1).join('.') || issue.path.join('.');
        fieldErrors[key] = issue.message;
      }
      return next(new ApiError(422, 'Validation failed', fieldErrors));
    }
    next(err);
  }
};
