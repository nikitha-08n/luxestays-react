import ApiError from '../utils/ApiError.js';

/**
 * Express middleware validating requests using Zod schemas.
 * @param {import('zod').AnyZodObject} schema 
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Re-assign fields to capture Zod-applied formatting (e.g. lowercase, trim)
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      next();
    } catch (error) {
      const errorDetails = error.errors 
        ? error.errors.map((err) => ({
            field: err.path.slice(1).join('.') || 'body', // remove 'body' prefix from path
            message: err.message,
          }))
        : [];
      
      next(new ApiError(400, 'Request validation failed', errorDetails));
    }
  };
};

export default validate;
