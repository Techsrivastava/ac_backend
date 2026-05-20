import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  return res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};
