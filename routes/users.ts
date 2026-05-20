import { Router } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { authenticate, authorize } from '../src/middleware/auth.js';
import { AuthRequest } from '../src/types/index.js';
import { ApiError } from '../src/utils/ApiError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';

const router = Router();

// Get all users (super admin only)
router.get('/', authenticate, authorize('super_admin'), asyncHandler(async (req: AuthRequest, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: users });
}));

// Get single user
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Check if user is requesting their own data or is admin
  if (user.id !== req.user!.id && !['admin', 'super_admin'].includes(req.user!.role)) {
    throw ApiError.forbidden('Not authorized');
  }

  res.json({ success: true, data: user });
}));

// Update user role (super admin only)
router.patch('/:id/role', authenticate, authorize('super_admin'), asyncHandler(async (req: AuthRequest, res) => {
  const { role } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
  res.json({ success: true, data: user });
}));

// Update user profile (self only)
router.patch('/:id/profile', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  if (req.params.id !== req.user!.id) {
    throw ApiError.forbidden('Not authorized');
  }

  const { name, phone, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, phone, avatarUrl },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
  res.json({ success: true, data: user });
}));

// Delete user (super admin only)
router.delete('/:id', authenticate, authorize('super_admin'), asyncHandler(async (req: AuthRequest, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'User deleted' });
}));

export default router;
