import express from 'express';
import Pincode from '../models/Pincode.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Check pincode availability
router.get('/check/:pincode', async (req, res) => {
  try {
    const pincode = await Pincode.findOne({ pincode: req.params.pincode });
    
    if (!pincode) {
      return res.json({ 
        available: false, 
        message: 'Delivery not available for this pincode' 
      });
    }

    if (!pincode.available) {
      return res.json({ 
        available: false, 
        message: 'Delivery temporarily unavailable for this pincode' 
      });
    }

    res.json({
      available: true,
      city: pincode.city,
      state: pincode.state,
      deliveryDays: pincode.deliveryDays,
      message: `Delivery available in ${pincode.deliveryDays} days`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check pincode' });
  }
});

// Get all pincodes (admin only)
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const pincodes = await Pincode.find().sort({ pincode: 1 });
    res.json(pincodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pincodes' });
  }
});

// Add pincode (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const pincode = new Pincode(req.body);
    await pincode.save();
    res.status(201).json(pincode);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add pincode' });
  }
});

// Update pincode (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const pincode = await Pincode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pincode) {
      return res.status(404).json({ error: 'Pincode not found' });
    }
    res.json(pincode);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update pincode' });
  }
});

// Delete pincode (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const pincode = await Pincode.findByIdAndDelete(req.params.id);
    if (!pincode) {
      return res.status(404).json({ error: 'Pincode not found' });
    }
    res.json({ message: 'Pincode deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pincode' });
  }
});

export default router;
