import express from 'express';
import Coupon from '../models/Coupon';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get all coupons (admin only)
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Get active coupons (public)
router.get('/active', async (req, res) => {
  try {
    const coupons = await Coupon.find({ active: true, expiryDate: { $gt: new Date() } });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active coupons' });
  }
});

// Validate coupon
router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      active: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or expired coupon' });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        error: `Minimum order amount is ${coupon.minOrderAmount}` 
      });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    let discount = 0;
    if (coupon.type === 'flat') {
      discount = coupon.value;
    } else {
      discount = (orderAmount * coupon.value) / 100;
    }

    res.json({
      valid: true,
      discount,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Create coupon (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create coupon' });
  }
});

// Update coupon (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update coupon' });
  }
});

// Delete coupon (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

export default router;
