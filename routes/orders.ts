import { Router } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { authenticate, authorize } from '../src/middleware/auth.js';
import { AuthRequest } from '../src/types/index.js';
import { ApiError } from '../src/utils/ApiError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';

const router = Router();

// Get all orders (admin only)
router.get('/', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: orders });
}));

// Get user's orders
router.get('/my-orders', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: orders });
}));

// Get single order
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } }
        }
      }
    }
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Check if user owns the order or is admin
  if (order.userId !== req.user!.id && !['admin', 'super_admin'].includes(req.user!.role)) {
    throw ApiError.forbidden('Not authorized');
  }

  res.json({ success: true, data: order });
}));

// Create order
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { items, shippingAddress, billingAddress, customerEmail, customerPhone, customerName, couponCode } = req.body;

  // Calculate subtotal
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  // Calculate shipping charges (free for orders above 500)
  const shippingAmount = subtotal > 500 ? 0 : 50;

  // Calculate tax (18% GST)
  const taxAmount = Math.round((subtotal * 18) / 100);

  // Calculate discount if coupon provided
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
        endDate: { gt: new Date() },
        usageCount: { lt: prisma.coupon.fields.usageLimit }
      }
    });
    if (coupon) {
      if (coupon.type === 'fixed_amount') {
        discountAmount = Number(coupon.value);
      } else {
        discountAmount = Math.round((subtotal * Number(coupon.value)) / 100);
      }
    }
  }

  // Calculate total
  const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: req.user!.id,
      customerEmail,
      customerPhone,
      customerName,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      subtotal,
      discountAmount,
      taxAmount,
      shippingAmount,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          productName: item.name,
          productSku: item.sku,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        }))
      }
    },
    include: {
      items: true
    }
  });

  res.status(201).json({ success: true, data: order });
}));

// Update order status (admin only)
router.patch('/:id/status', authenticate, authorize('admin', 'super_admin'), asyncHandler(async (req: AuthRequest, res) => {
  const { status } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json({ success: true, data: order });
}));

// Update payment status
router.patch('/:id/payment', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { paymentStatus, paymentMethod } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { paymentStatus, paymentMethod }
  });
  res.json({ success: true, data: order });
}));

export default router;
