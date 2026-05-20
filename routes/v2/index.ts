import { Router } from 'express';
import authRoutes from './auth.js';
import categoryRoutes from './categories.js';
import productRoutes from './products.js';
import blogRoutes from './blogs.js';
import uploadRoutes from './upload.js';
import settingsRoutes from './settings.js';

const router = Router();

// Mount all v2 routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/blogs', blogRoutes);
router.use('/upload', uploadRoutes);
router.use('/settings', settingsRoutes);

export default router;
