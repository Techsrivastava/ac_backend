import express from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { authenticate, authorize } from '../../src/middleware/auth.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticate, authorize('admin', 'super_admin'), async (req: any, res: any) => {
  try {
    const totalOrders = await prisma.order.count();
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    
    // Calculate total revenue (only from confirmed/shipped/delivered orders)
    const validOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['confirmed', 'shipped', 'delivered']
        }
      }
    });
    const totalRevenue = validOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          createdAt: order.createdAt,
          totalAmount: Number(order.totalAmount),
          status: order.status,
          user: order.user ? {
            name: order.user.name,
            email: order.user.email
          } : {
            name: order.customerName,
            email: order.customerEmail
          }
        }))
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
