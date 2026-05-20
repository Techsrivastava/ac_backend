import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      brand,
      type,
      featured,
      minPrice,
      maxPrice,
      search,
      page = '1',
      limit = '20',
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const where: any = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }
    if (brand) {
      where.brand = { contains: brand as string, mode: 'insensitive' };
    }
    if (type) {
      where.type = type;
    }
    if (featured === 'true') {
      where.isFeatured = true;
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { [sort as string]: order },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product
    const productsWithRating = await Promise.all(
      products.map(async (p) => {
        const reviews = await prisma.review.findMany({
          where: { productId: p.id, isApproved: true },
          select: { rating: true },
        });
        const avgRating = reviews.length > 0
          ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          : 0;

        return {
          ...p,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          _count: undefined,
        };
      })
    );

    res.json({
      products: productsWithRating,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get single product (public)
router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        specifications: { orderBy: { sortOrder: 'asc' } },
        features: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { name: true } }, images: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
      : 0;

    res.json({
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Create product (admin only)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      brand,
      categoryId,
      price,
      discountPrice,
      stockQuantity,
      sku,
      type,
      coolingCapacity,
      energyRating,
      warranty,
      installationCharges,
      isFeatured,
      isActive,
      weightKg,
      dimensions,
      metaTitle,
      metaDescription,
      images,
      specifications,
      features,
    } = req.body;

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description,
        shortDescription,
        brand,
        categoryId,
        price,
        discountPrice,
        stockQuantity,
        sku,
        type,
        coolingCapacity,
        energyRating,
        warranty,
        installationCharges,
        isFeatured,
        isActive,
        weightKg,
        dimensions,
        metaTitle,
        metaDescription,
        images: images?.length > 0 ? {
          create: images.map((img: any, idx: number) => ({
            imageUrl: img.url || img,
            altText: img.altText || name,
            isPrimary: idx === 0,
            sortOrder: idx,
          })),
        } : undefined,
        specifications: specifications?.length > 0 ? {
          create: specifications.map((spec: any, idx: number) => ({
            specKey: spec.key,
            specValue: spec.value,
            specGroup: spec.group || 'General',
            sortOrder: idx,
          })),
        } : undefined,
        features: features?.length > 0 ? {
          create: features.map((feat: string, idx: number) => ({
            featureText: feat,
            sortOrder: idx,
          })),
        } : undefined,
      },
      include: {
        category: true,
        images: true,
        specifications: true,
        features: true,
      },
    });

    res.status(201).json(product);
  } catch (error: any) {
    console.error('Create product error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'SKU or slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    // Handle nested updates
    const data: any = {
      ...updateData,
      images: undefined,
      specifications: undefined,
      features: undefined,
    };

    // Remove undefined values
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) delete data[key];
    });

    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: {
        category: true,
        images: true,
        specifications: true,
        features: true,
      },
    });

    res.json(product);
  } catch (error: any) {
    console.error('Update product error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'SKU or slug already exists' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Update product images (admin only)
router.put('/:id/images', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { images } = req.body;

    // Delete existing images and create new ones
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: req.params.id } }),
      prisma.productImage.createMany({
        data: images.map((img: any, idx: number) => ({
          productId: req.params.id,
          imageUrl: img.url || img,
          altText: img.altText || '',
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      }),
    ]);

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update images' });
  }
});

// Get all brands (public)
router.get('/filters/brands', async (req, res) => {
  try {
    const brands = await prisma.product.groupBy({
      by: ['brand'],
      _count: { brand: true },
      where: { isActive: true },
    });

    res.json(brands.map(b => ({
      name: b.brand,
      count: b._count.brand,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to get brands' });
  }
});

export default router;
