import express from 'express';
import Blog from '../models/Blog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all blogs (public)
router.get('/', async (req, res) => {
  try {
    const { status, category, featured, search, page = 1, limit = 10 } = req.query;
    
    const query: any = { status: 'published' };
    
    if (status && req.query.admin === 'true') {
      query.status = status;
    }
    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    if (search) {
      query.$text = { $search: search as string };
    }

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const count = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single blog by slug (public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single blog by ID (admin only)
router.get('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create blog (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req: AuthRequest, res) => {
  try {
    const { title, slug, excerpt, content, image, author, category, tags, status, featured, metaTitle, metaDescription } = req.body;

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const blog = new Blog({
      title,
      slug,
      excerpt,
      content,
      image,
      author: author || req.user?.name || 'Admin',
      category,
      tags: tags || [],
      status: status || 'draft',
      featured: featured || false,
      metaTitle,
      metaDescription
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update blog (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req: AuthRequest, res) => {
  try {
    const { title, slug, excerpt, content, image, author, category, tags, status, featured, metaTitle, metaDescription } = req.body;

    // Check if slug already exists (excluding current blog)
    if (slug) {
      const existingBlog = await Blog.findOne({ slug, _id: { $ne: req.params.id } });
      if (existingBlog) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        slug,
        excerpt,
        content,
        image,
        author,
        category,
        tags,
        status,
        featured,
        metaTitle,
        metaDescription,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete blog (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get blog categories (public)
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { status: 'published' });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get featured blogs (public)
router.get('/featured/list', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published', featured: true })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
