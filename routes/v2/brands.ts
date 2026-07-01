import express from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { authenticate, authorize } from '../../src/middleware/auth.js';

const router = express.Router();

// GET all active brands (public)
router.get('/', async (req: any, res: any) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Optionally calculate product counts for each brand
    // Since 'brand' is a string field on Product model
    const brandsWithCounts = await Promise.all(
      brands.map(async (brand) => {
        const count = await prisma.product.count({
          where: {
            brand: { equals: brand.name, mode: 'insensitive' },
            isActive: true
          }
        });
        return { ...brand, count };
      })
    );

    res.json(brandsWithCounts);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// GET all brands including inactive (admin)
router.get('/admin', authenticate, authorize('admin', 'super_admin'), async (req: any, res: any) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json(brands);
  } catch (error) {
    console.error('Error fetching admin brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// POST create brand (admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req: any, res: any) => {
  try {
    const { name, imageUrl, color, isActive, sortOrder } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existingBrand = await prisma.brand.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (existingBrand) {
      return res.status(400).json({ error: 'Brand already exists' });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        imageUrl,
        color: color || 'bg-slate-900 text-white',
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      }
    });

    res.status(201).json(brand);
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

// PUT update brand (admin)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, imageUrl, color, isActive, sortOrder } = req.body;

    const existingBrand = await prisma.brand.findUnique({ where: { id } });
    if (!existingBrand) return res.status(404).json({ error: 'Brand not found' });

    const dataToUpdate: any = {
      imageUrl,
      color,
      isActive,
      sortOrder
    };

    if (name && name !== existingBrand.name) {
      dataToUpdate.name = name;
      dataToUpdate.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: dataToUpdate
    });

    res.json(brand);
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

// DELETE brand (admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    await prisma.brand.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

export default router;
