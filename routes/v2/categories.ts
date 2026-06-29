import { Router } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { authenticate, authorize } from '../../src/middleware/auth.js';

const router = Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    res.json(categories.map(c => ({
      ...c,
      productCount: c._count.products,
      _count: undefined,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get single category (public)
router.get('/:slug', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      ...category,
      productCount: category._count.products,
      _count: undefined,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// Create category (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { name, slug, description, imageUrl, parentId, sortOrder } = req.body;

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        description,
        imageUrl,
        parentId,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { name, slug, description, imageUrl, parentId, sortOrder, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        slug,
        description,
        imageUrl,
        parentId,
        sortOrder,
        isActive,
      },
    });

    res.json(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
