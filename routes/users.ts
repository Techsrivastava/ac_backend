import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all users (super admin only)
router.get('/', authenticate, authorize('super_admin'), async (req: AuthRequest, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is requesting their own data or is admin
    if (user._id.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role (super admin only)
router.patch('/:id/role', authenticate, authorize('super_admin'), async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (super admin only)
router.delete('/:id', authenticate, authorize('super_admin'), async (req: AuthRequest, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
