import { Router } from 'express';
import { prisma } from '../../src/lib/prisma.js';
import { authenticate, authorize } from '../../src/middleware/auth.js';

const router = Router();

// Get all site settings (public)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    // Group by group
    const grouped = settings.reduce((acc: any, setting) => {
      if (!acc[setting.group]) acc[setting.group] = [];
      acc[setting.group].push(setting);
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Get settings as key-value (public)
router.get('/values', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const values = settings.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json(values);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Get single setting (public)
router.get('/:key', async (req, res) => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: req.params.key },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get setting' });
  }
});

// Update settings (admin only)
router.put('/:key', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { value, type, group, label, description } = req.body;

    const setting = await prisma.siteSetting.upsert({
      where: { key: req.params.key },
      update: { value, type, group, label, description },
      create: {
        key: req.params.key,
        value,
        type: type || 'string',
        group: group || 'general',
        label: label || req.params.key,
        description,
      },
    });

    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Bulk update settings (admin only)
router.put('/', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { settings } = req.body;

    const results = await Promise.all(
      settings.map(async (s: any) => {
        return prisma.siteSetting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: {
            key: s.key,
            value: s.value,
            type: s.type || 'string',
            group: s.group || 'general',
            label: s.label || s.key,
          },
        });
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Homepage sections (public)
router.get('/homepage/sections', async (req, res) => {
  try {
    const sections = await prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get homepage sections' });
  }
});

// Update homepage section (admin only)
router.put('/homepage/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const section = await prisma.homepageSection.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(section);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Create homepage section (admin only)
router.post('/homepage', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const section = await prisma.homepageSection.create({
      data: req.body,
    });

    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// Menu management (public)
router.get('/menu/:name', async (req, res) => {
  try {
    const menu = await prisma.menu.findUnique({
      where: { name: req.params.name },
    });

    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get menu' });
  }
});

// Update menu (admin only)
router.put('/menu/:name', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { items } = req.body;

    const menu = await prisma.menu.upsert({
      where: { name: req.params.name },
      update: { items },
      create: { name: req.params.name, items },
    });

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

// Hero Slides (public)
router.get('/hero/slides', async (req, res) => {
  try {
    const slides = await prisma.homepageSection.findMany({
      where: { sectionType: 'hero', isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hero slides' });
  }
});

// Create hero slide (admin)
router.post('/hero/slides', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const slide = await prisma.homepageSection.create({
      data: {
        ...req.body,
        sectionType: 'hero',
      },
    });
    res.status(201).json(slide);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create slide' });
  }
});

// Update hero slide (admin)
router.put('/hero/slides/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const slide = await prisma.homepageSection.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(slide);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

// Delete hero slide (admin)
router.delete('/hero/slides/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    await prisma.homepageSection.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Slide deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

// Brand Logos (public)
router.get('/brands/logos', async (req, res) => {
  try {
    const brands = await prisma.homepageSection.findMany({
      where: { sectionType: 'brand_logo', isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get brand logos' });
  }
});

// Create brand logo (admin)
router.post('/brands/logos', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const brand = await prisma.homepageSection.create({
      data: {
        ...req.body,
        sectionType: 'brand_logo',
      },
    });
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

// Update brand logo (admin)
router.put('/brands/logos/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const brand = await prisma.homepageSection.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

// Delete brand logo (admin)
router.delete('/brands/logos/:id', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    await prisma.homepageSection.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Brand logo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

export default router;
