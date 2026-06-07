import { Router } from 'express';
import { prisma } from '../../src/lib/prisma.js';

const router = Router();

// Get all active homepage sections
router.get('/sections', async (req, res) => {
  try {
    const sections = await prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch homepage sections' });
  }
});

// Get primary menu
router.get('/menu', async (req, res) => {
  try {
    const menu = await prisma.menu.findUnique({
      where: { name: 'primary' },
    });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

export default router;
