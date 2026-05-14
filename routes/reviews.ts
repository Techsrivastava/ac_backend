import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    res.json({ reviews, avgRating });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get user's reviews
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const reviews = await Review.find({ user: userId })
      .populate('product', 'name images')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// Create review
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { productId, rating, comment } = req.body;

    // Check if user has purchased this product
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: 'delivered'
    });

    const verifiedPurchase = !!order;

    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
      verifiedPurchase
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create review' });
  }
});

// Update review
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      req.body,
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
