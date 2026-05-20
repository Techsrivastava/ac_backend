import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';

type AsyncRequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };
};
