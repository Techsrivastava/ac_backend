import express from 'express';
import Product from '../models/Product.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for image upload (multiple images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, featured, type, brand } = req.query;
    const filter: any = {};
    
    if (category) filter.category = category;
    if (featured) filter.featured = featured === 'true';
    if (type) filter.type = type;
    if (brand) filter.brand = brand;

    const products = await Product.find(filter).populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), upload.array('images', 5), async (req: AuthRequest, res) => {
  try {
    const imagePaths = req.files ? (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`) : [];
    const existingImages = req.body.images ? JSON.parse(req.body.images) : [];
    
    const productData = {
      ...req.body,
      images: [...existingImages, ...imagePaths].length > 0 ? [...existingImages, ...imagePaths] : ['/placeholder.png']
    };
    
    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), upload.array('images', 5), async (req: AuthRequest, res) => {
  try {
    const updateData: any = { ...req.body };
    
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const imagePaths = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
      const existingImages = req.body.images ? JSON.parse(req.body.images) : [];
      updateData.images = [...existingImages, ...imagePaths];
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req: AuthRequest, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
