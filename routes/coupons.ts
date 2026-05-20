import { Router } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { authenticate, authorize } from '../src/middleware/auth.js';
import { ApiError } from '../src/utils/ApiError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';

const router = Router();

// Get all coupons (admin only)
router.get('/', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: coupons });
}));

// Get active coupons (public)
router.get('/active', asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gt: now },
      usageCount: { lt: prisma.coupon.fields.usageLimit }
    }
  });
  res.json({ success: true, data: coupons });
}));

// Validate coupon
router.post('/validate', asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (!coupon || !coupon.isActive) {
    throw ApiError.badRequest('Invalid or expired coupon');
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw ApiError.badRequest('Coupon is not valid at this time');
  }

  if (coupon.usageCount >= coupon.usageLimit) {
    throw ApiError.badRequest('Coupon usage limit reached');
  }

  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
    throw ApiError.badRequest(`Minimum order amount is ${coupon.minOrderAmount}`);
  }

  let discount = 0;
  if (coupon.type === 'fixed_amount') {
    discount = Number(coupon.value);
  } else {
    discount = (orderAmount * Number(coupon.value)) / 100;
  }

  if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
    discount = Number(coupon.maxDiscountAmount);
  }

  res.json({
    success: true,
    valid: true,
    discount,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value
    }
  });
}));

// Create coupon (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.create({ data: req.body });
  res.status(201).json({ success: true, data: coupon });
}));

// Update coupon (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json({ success: true, data: coupon });
}));

// Delete coupon (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Coupon deleted successfully' });
}));

export default router;
