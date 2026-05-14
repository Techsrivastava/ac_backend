import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name, role: role || 'user' });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Seed super admin and admin (for development only)
router.post('/seed', async (req, res) => {
  try {
    // Clear existing admin users first
    await User.deleteMany({ role: { $in: ['admin', 'super_admin'] } });
    
    const users = [
      {
        email: 'superadmin@becool.com',
        password: 'superadmin123',
        name: 'Super Admin',
        role: 'super_admin'
      },
      {
        email: 'admin@becool.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      }
    ];

    const created = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role
      });
      await user.save();
      created.push({ email: userData.email, role: userData.role });
    }

    res.json({
      message: 'Admin users seeded successfully',
      created,
      credentials: [
        { email: 'superadmin@becool.com', password: 'superadmin123' },
        { email: 'admin@becool.com', password: 'admin123' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
