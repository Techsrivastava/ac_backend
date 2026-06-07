import { Router } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { authenticate, authorize } from '../../src/middleware/auth.js';

const router = Router();

// Get admin dashboard stats
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      categoryStats
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'completed' },
        _sum: { totalAmount: true }
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      }),
      prisma.category.findMany({
        include: { _count: { select: { products: true } } }
      })
    ]);

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers: totalUsers,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
      },
      recentOrders,
      categoryDistribution: categoryStats.map(c => ({
        name: c.name,
        value: c._count.products
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
