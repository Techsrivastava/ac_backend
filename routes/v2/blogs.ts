import { Router } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { authenticate, authorize } from '../../src/middleware/auth.js';

const router = Router();

// Get all blogs (public)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      status,
      featured,
      search,
      page = '1',
      limit = '10',
      admin,
    } = req.query;

    const where: any = {};

    // Only show published for public
    if (admin !== 'true') {
      where.status = 'published';
    } else if (status) {
      where.status = status;
    }

    if (category) where.category = category;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
        },
      }),
      prisma.blog.count({ where }),
    ]);

    res.json({
      blogs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get blogs' });
  }
});

// Get blog categories (public)
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await prisma.blog.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { status: 'published' },
    });

    res.json(categories.map(c => ({
      name: c.category,
      count: c._count.category,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get featured blogs (public)
router.get('/featured/list', async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: 'published', isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        author: { select: { name: true } },
      },
    });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get featured blogs' });
  }
});

// Get single blog by slug (public) - increments view count
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await prisma.blog.update({
      where: { slug: req.params.slug },
      data: { viewCount: { increment: 1 } },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        images: true,
      },
    });

    if (!blog || blog.status !== 'published') {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Get related blogs
    const related = await prisma.blog.findMany({
      where: {
        status: 'published',
        category: blog.category,
        id: { not: blog.id },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, featuredImageUrl: true, excerpt: true, createdAt: true },
    });

    res.json({ blog, related });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get blog' });
  }
});

// Get single blog by ID (admin)
router.get('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true } },
        images: true,
      },
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get blog' });
  }
});

// Create blog (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImageUrl,
      category,
      tags,
      status,
      isFeatured,
      metaTitle,
      metaDescription,
      publishedAt,
    } = req.body;

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check for duplicate slug
    const existing = await prisma.blog.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug: finalSlug,
        excerpt,
        content,
        featuredImageUrl,
        authorId: req.user.userId,
        category,
        tags: tags || [],
        status,
        isFeatured,
        metaTitle,
        metaDescription,
        publishedAt: publishedAt || (status === 'published' ? new Date() : null),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(blog);
  } catch (error: any) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// Update blog (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImageUrl,
      category,
      tags,
      status,
      isFeatured,
      metaTitle,
      metaDescription,
      publishedAt,
    } = req.body;

    // Check for duplicate slug
    if (slug) {
      const existing = await prisma.blog.findFirst({
        where: { slug, id: { not: req.params.id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data: {
        title,
        slug,
        excerpt,
        content,
        featuredImageUrl,
        category,
        tags,
        status,
        isFeatured,
        metaTitle,
        metaDescription,
        publishedAt,
        updatedAt: new Date(),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Delete blog (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

export default router;
