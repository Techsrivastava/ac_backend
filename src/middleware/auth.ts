import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { AuthRequest, AuthenticatedUser } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    req.user = user as AuthenticatedUser;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = user as AuthenticatedUser;
      }
    }

    next();
  } catch {
    next();
  }
};
