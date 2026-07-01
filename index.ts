import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './src/config/env.js';
import { prisma } from './src/lib/prisma.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

// Import routes (refactored to use Prisma)
import authRoutes from './routes/v2/auth.js';
import productRoutes from './routes/v2/products.js';
import categoryRoutes from './routes/v2/categories.js';
import blogRoutes from './routes/v2/blogs.js';
import settingsRoutes from './routes/v2/settings.js';
import uploadRoutes from './routes/v2/upload.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import paypalRoutes from './routes/paypal.js';
import couponRoutes from './routes/coupons.js';
import wishlistRoutes from './routes/wishlist.js';
import reviewRoutes from './routes/reviews.js';
import pincodeRoutes from './routes/pincodes.js';
import adminRoutes from './routes/v2/admin.js';
import brandsRoutes from './routes/v2/brands.js';

const app = express();
const PORT = env.PORT;

// Trust proxy for rate limiting behind Railway's load balancer
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Database health check middleware
app.use('/api/*', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({ success: false, error: 'Database unavailable' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/pincodes', pincodeRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});
