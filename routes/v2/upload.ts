import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs/promises';
import { prisma } from '../../src/lib/prisma.js';
import { authenticate } from '../../src/middleware/auth.js';

const router = Router();

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const folders = ['products', 'blogs', 'categories', 'site', 'temp'];

async function ensureDirectories() {
  for (const folder of folders) {
    const dir = path.join(uploadDir, folder);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {}
  }
}
ensureDirectories();

// Multer storage configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// Process and save image
async function processImage(
  buffer: Buffer,
  filename: string,
  folder: string,
  options: { width?: number; height?: number; quality?: number } = {}
) {
  const { width = 1200, height, quality = 80 } = options;

  // Original WebP
  const originalPath = path.join(uploadDir, folder, `${filename}.webp`);
  await sharp(buffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(originalPath);

  // Thumbnail
  const thumbPath = path.join(uploadDir, folder, `${filename}-thumb.webp`);
  await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 70 })
    .toFile(thumbPath);

  return {
    url: `/uploads/${folder}/${filename}.webp`,
    thumbnailUrl: `/uploads/${folder}/${filename}-thumb.webp`,
  };
}

// Single image upload
router.post('/', authenticate, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const folder = (req.body.folder || 'temp') as string;
    const filename = uuidv4();

    const { url, thumbnailUrl } = await processImage(req.file.buffer, filename, folder, {
      width: parseInt(req.body.maxWidth) || 1200,
      quality: parseInt(req.body.quality) || 80,
    });

    // Save to media library
    const media = await prisma.media.create({
      data: {
        filename: `${filename}.webp`,
        originalName: req.file.originalname,
        mimeType: 'image/webp',
        sizeBytes: req.file.size,
        url,
        thumbnailUrl,
        folder,
        uploadedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      url,
      thumbnailUrl,
      mediaId: media.id,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Multiple images upload
router.post('/multiple', authenticate, upload.array('images', 10), async (req: any, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const folder = (req.body.folder || 'temp') as string;
    const results = [];

    for (const file of req.files as Express.Multer.File[]) {
      const filename = uuidv4();

      const { url, thumbnailUrl } = await processImage(file.buffer, filename, folder, {
        width: parseInt(req.body.maxWidth) || 1200,
        quality: parseInt(req.body.quality) || 80,
      });

      const media = await prisma.media.create({
        data: {
          filename: `${filename}.webp`,
          originalName: file.originalname,
          mimeType: 'image/webp',
          sizeBytes: file.size,
          url,
          thumbnailUrl,
          folder,
          uploadedBy: req.user.userId,
        },
      });

      results.push({ url, thumbnailUrl, mediaId: media.id });
    }

    res.json({
      success: true,
      images: results,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Get media library
router.get('/media', authenticate, async (req: any, res) => {
  try {
    const { folder, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (folder) where.folder = folder;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { name: true } },
        },
      }),
      prisma.media.count({ where }),
    ]);

    res.json({
      media,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// Delete media
router.delete('/media/:id', authenticate, async (req: any, res) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: req.params.id } });
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete files
    try {
      await fs.unlink(path.join(process.cwd(), media.url.slice(1)));
      if (media.thumbnailUrl) {
        await fs.unlink(path.join(process.cwd(), media.thumbnailUrl.slice(1)));
      }
    } catch {}

    await prisma.media.delete({ where: { id: req.params.id } });
    res.json({ message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
