import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Generic request validator middleware mapping to Zod schemas.
 * Validates req.body, req.query, or req.params and formats clean, secure validation responses.
 */
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace request values with safely parsed & sanitized versions
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Input validation failed',
          details: error.errors.map(err => ({
            field: err.path.slice(1).join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
