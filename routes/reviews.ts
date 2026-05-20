import { Router } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { authenticate } from '../src/middleware/auth.js';
import { AuthRequest } from '../src/types/index.js';
import { ApiError } from '../src/utils/ApiError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';

const router = Router();

// Get reviews for a product
router.get('/product/:productId', asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.productId, isApproved: true },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      images: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  res.json({
    success: true,
    data: { reviews, avgRating, total: reviews.length }
  });
}));

// Get user's reviews
router.get('/user', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const reviews = await prisma.review.findMany({
    where: { userId: req.user!.id },
    include: {
      product: {
        select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } }
      },
      images: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: reviews });
}));

// Create review
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { productId, rating, title, content, orderId } = req.body;

  // Check if user has already reviewed this product
  const existingReview = await prisma.review.findFirst({
    where: { userId: req.user!.id, productId }
  });

  if (existingReview) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  // Check if user has purchased this product (optional verification)
  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user!.id,
        status: 'delivered',
        items: { some: { productId } }
      }
    });
    isVerifiedPurchase = !!order;
  }

  const review = await prisma.review.create({
    data: {
      userId: req.user!.id,
      productId,
      orderId,
      rating,
      title,
      content,
      isVerifiedPurchase
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } }
    }
  });

  res.status(201).json({ success: true, data: review });
}));

// Update review
router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { rating, title, content } = req.body;

  const review = await prisma.review.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { rating, title, content }
  });

  if (review.count === 0) {
    throw ApiError.notFound('Review not found');
  }

  const updatedReview = await prisma.review.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } }
    }
  });

  res.json({ success: true, data: updatedReview });
}));

// Delete review
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const review = await prisma.review.deleteMany({
    where: { id: req.params.id, userId: req.user!.id }
  });

  if (review.count === 0) {
    throw ApiError.notFound('Review not found');
  }

  res.json({ success: true, message: 'Review deleted successfully' });
}));

export default router;
