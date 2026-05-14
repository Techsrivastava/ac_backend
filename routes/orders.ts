import express from 'express';
import Order from '../models/Order.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all orders (admin only)
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req: AuthRequest, res) => {
  try {
    const orders = await Order.find().populate('user').populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's orders
router.get('/my-orders', authenticate, async (req: AuthRequest, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user').populate('items.product');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create order
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { items, shippingAddress, couponCode } = req.body;
    
    // Calculate subtotal
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // Calculate shipping charges (free for orders above 500)
    const shippingCharges = subtotal > 500 ? 0 : 50;
    
    // Calculate GST (18%)
    const gst = Math.round((subtotal * 18) / 100);
    
    // Calculate discount if coupon provided
    let discount = 0;
    if (couponCode) {
      // Validate coupon (simplified - in production, use coupon service)
      const Coupon = require('../models/Coupon').default;
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon) {
        if (coupon.type === 'flat') {
          discount = coupon.value;
        } else {
          discount = Math.round((subtotal * coupon.value) / 100);
        }
      }
    }
    
    // Calculate total
    const totalAmount = subtotal + shippingCharges + gst - discount;
    
    const order = new Order({
      user: req.user._id,
      items,
      subtotal,
      shippingCharges,
      gst,
      discount,
      couponCode,
      totalAmount,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', authenticate, authorize('admin', 'super_admin'), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update payment status
router.patch('/:id/payment', authenticate, async (req: AuthRequest, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentId },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
