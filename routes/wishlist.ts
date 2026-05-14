import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user's wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    let wishlist = await Wishlist.findOne({ user: userId }).populate('products');
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
      await wishlist.save();
    }
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add product to wishlist
router.post('/add', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [productId] });
    } else {
      if (!wishlist.products.includes(productId as any)) {
        wishlist.products.push(productId);
      }
    }
    
    await wishlist.save();
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove product from wishlist
router.delete('/remove/:productId', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      (p: any) => p.toString() !== productId
    );
    
    await wishlist.save();
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Clear wishlist
router.delete('/clear', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { products: [] },
      { new: true }
    );
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

export default router;
