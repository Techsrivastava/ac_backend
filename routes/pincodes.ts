import { Router } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { authenticate, authorize } from '../src/middleware/auth.js';
import { ApiError } from '../src/utils/ApiError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';

const router = Router();

// Check pincode availability
router.get('/check/:pincode', asyncHandler(async (req, res) => {
  const pincode = await prisma.pincode.findUnique({
    where: { pincode: req.params.pincode }
  });

  if (!pincode) {
    return res.json({
      success: true,
      available: false,
      message: 'Delivery not available for this pincode'
    });
  }

  if (!pincode.isServiceable) {
    return res.json({
      success: true,
      available: false,
      message: 'Delivery temporarily unavailable for this pincode'
    });
  }

  res.json({
    success: true,
    available: true,
    city: pincode.city,
    state: pincode.state,
    deliveryDays: pincode.deliveryDays,
    shippingCharge: pincode.shippingCharge,
    message: `Delivery available in ${pincode.deliveryDays} days`
  });
}));

// Get all pincodes (admin only)
router.get('/', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const pincodes = await prisma.pincode.findMany({
    orderBy: { pincode: 'asc' }
  });
  res.json({ success: true, data: pincodes });
}));

// Add pincode (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const pincode = await prisma.pincode.create({ data: req.body });
  res.status(201).json({ success: true, data: pincode });
}));

// Update pincode (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const pincode = await prisma.pincode.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json({ success: true, data: pincode });
}));

// Delete pincode (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  await prisma.pincode.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Pincode deleted successfully' });
}));

export default router;
