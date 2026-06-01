import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Centrally Managed Secure Error Handler.
 * Catches all runtime route failures and sanitizes responses in production to prevent stack trace leaks.
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Safe Server-side logging
  console.error(`❌ [Internal Exception]: ${error.message}`);
  if (env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  // Format standard HTTP status
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: statusCode === 500 ? 'An unexpected internal server error occurred.' : error.message,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
