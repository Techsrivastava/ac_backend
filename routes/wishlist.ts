import { Router } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { authenticate } from '../src/middleware/auth.js';
import { AuthRequest } from '../src/types/index.js';
import { ApiError } from '../src/utils/ApiError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';

const router = Router();

// Get user's wishlist
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user!.id },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: wishlist });
}));

// Add product to wishlist
router.post('/add', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { productId } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId } }
  });

  if (existing) {
    throw ApiError.conflict('Product already in wishlist');
  }

  const wishlistItem = await prisma.wishlist.create({
    data: { userId: req.user!.id, productId },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 }
        }
      }
    }
  });

  res.status(201).json({ success: true, data: wishlistItem });
}));

// Remove product from wishlist
router.delete('/remove/:productId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { productId } = req.params;

  await prisma.wishlist.delete({
    where: { userId_productId: { userId: req.user!.id, productId } }
  });

  res.json({ success: true, message: 'Removed from wishlist' });
}));

// Clear wishlist
router.delete('/clear', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  await prisma.wishlist.deleteMany({ where: { userId: req.user!.id } });
  res.json({ success: true, message: 'Wishlist cleared' });
}));

export default router;
