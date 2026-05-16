import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import paypalRoutes from './routes/paypal.js';
import couponRoutes from './routes/coupons.js';
import wishlistRoutes from './routes/wishlist.js';
import reviewRoutes from './routes/reviews.js';
import pincodeRoutes from './routes/pincodes.js';
import blogRoutes from './routes/blogs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Allow frontend domain
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173', 'https://becoolheating.com/'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://adarshsrivastavawork_db_user:cePbYCiRobld5qhP@cluster0.jqpxp1k.mongodb.net/?appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/pincodes', pincodeRoutes);
app.use('/api/blogs', blogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
