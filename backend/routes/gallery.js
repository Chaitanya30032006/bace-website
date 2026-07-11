const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { authenticate, restrictTo } = require('../middleware/auth');
const { validateImageMagicBytes } = require('../middleware/fileValidation');
const { validate, albumSchema } = require('../middleware/validate');
const { isCloudinaryConfigured, galleryUpload, cloudinary } = require('../config/cloudinary');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `memory-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/i;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Error: Only images are allowed!'));
  }
});

router.get('/albums', authenticate, async (req, res) => {
  try {
    const albums = await prisma.album.findMany({ orderBy: { eventDate: 'desc' } });
    res.status(200).json({ status: 'success', data: albums });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve albums', error: error.message });
  }
});

router.post('/albums', authenticate, restrictTo('Admin'), validate(albumSchema), async (req, res) => {
  try {
    const { title, eventName, eventDate, description } = req.validatedBody;

    const year = new Date(eventDate).getFullYear();
    const album = await prisma.album.create({
      data: {
        title,
        eventName,
        eventDate: new Date(eventDate),
        year,
        description,
        createdBy: req.user.id
      }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'CREATE_ALBUM',
        details: `Created album: ${title} for event ${eventName} in year ${year}.`
      }
    });

    res.status(201).json({ status: 'success', data: album });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create album', error: error.message });
  }
});

router.get('/photos', authenticate, async (req, res) => {
  try {
    const { year, albumId } = req.query;

    const photos = await prisma.photo.findMany({
      where: {
        isApproved: true,
        ...(albumId ? { albumId } : {}),
        ...(year ? { album: { year: parseInt(year, 10) } } : {})
      },
      include: {
        album: { select: { title: true, eventName: true, eventDate: true, year: true } },
        uploader: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: photos });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve photos', error: error.message });
  }
});

// Helper: get or create a default album for the given year
async function getOrCreateYearAlbum(year, userId) {
  const yearInt = parseInt(year, 10);
  let album = await prisma.album.findFirst({ where: { year: yearInt } });
  if (!album) {
    album = await prisma.album.create({
      data: {
        title: `Memories ${yearInt}`,
        eventName: `BACE Events ${yearInt}`,
        eventDate: new Date(`${yearInt}-01-01`),
        year: yearInt,
        description: `Photos from ${yearInt}`,
        createdBy: userId
      }
    });
  }
  return album;
}

router.post('/upload', authenticate, restrictTo('Admin'), upload.single('photo'), validateImageMagicBytes, async (req, res) => {
  try {
    const { year, albumId } = req.body;

    if (!albumId && !year) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Album or year is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    let album;
    if (albumId) {
      album = await prisma.album.findUnique({ where: { id: albumId } });
      if (!album) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Album not found' });
      }
    } else {
      album = await getOrCreateYearAlbum(year, req.user.id);
    }

    let photoUrl;
    if (isCloudinaryConfigured()) {
      // Upload to Cloudinary and use the cloud URL
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'bace/gallery',
        quality: 'auto',
        fetch_format: 'auto'
      });
      photoUrl = result.secure_url;
      // Remove local temp file
      fs.unlinkSync(req.file.path);
    } else {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const photo = await prisma.photo.create({
      data: {
        albumId: album.id,
        photoUrl,
        uploadedBy: req.user.id,
        isApproved: true,
        approvedBy: req.user.id
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Photo uploaded successfully',
      data: photo
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Photo upload failed', error: error.message });
  }
});

router.get('/pending', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { isApproved: false },
      include: {
        album: { select: { title: true, eventName: true, year: true } },
        uploader: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({ status: 'success', data: photos });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve pending photos', error: error.message });
  }
});

router.post('/photos/:id/approve', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    await prisma.photo.update({
      where: { id: photo.id },
      data: { isApproved: true, approvedBy: req.user.id }
    });

    await prisma.notification.create({
      data: {
        userId: photo.uploadedBy,
        message: 'Your uploaded photo in album has been approved and is now live in the BACE gallery.',
        type: 'PHOTO_APPROVED'
      }
    });

    res.status(200).json({ status: 'success', message: 'Photo approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve photo', error: error.message });
  }
});

router.delete('/photos/:id', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const filename = path.basename(photo.photoUrl);
    const filepath = path.join(uploadDir, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    await prisma.photo.delete({ where: { id: photo.id } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'DELETE_PHOTO',
        details: `Deleted photo ID ${req.params.id} from album ID ${photo.albumId}.`
      }
    });

    res.status(200).json({ status: 'success', message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete photo', error: error.message });
  }
});

// Bulk photo upload (up to 10 photos at once)
router.post('/upload-bulk', authenticate, restrictTo('Admin'), upload.array('photos', 10), validateImageMagicBytes, async (req, res) => {
  try {
    const { year, albumId } = req.body;

    if (!albumId && !year) {
      if (req.files) req.files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      return res.status(400).json({ message: 'Album or year is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one image file' });
    }

    let album;
    if (albumId) {
      album = await prisma.album.findUnique({ where: { id: albumId } });
      if (!album) {
        req.files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        return res.status(404).json({ message: 'Album not found' });
      }
    } else {
      album = await getOrCreateYearAlbum(year, req.user.id);
    }
    const uploaded = [];

    for (const file of req.files) {
      const photoUrl = `/uploads/${file.filename}`;
      const photo = await prisma.photo.create({
        data: {
          albumId: album.id,
          photoUrl,
          uploadedBy: req.user.id,
          isApproved: true,
          approvedBy: req.user.id
        }
      });
      uploaded.push(photo);
    }

    res.status(201).json({
      status: 'success',
      message: `${uploaded.length} photo(s) uploaded successfully`,
      data: uploaded
    });
  } catch (error) {
    if (req.files) req.files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    res.status(500).json({ message: 'Bulk upload failed', error: error.message });
  }
});

// Cloudinary-based upload (used when CLOUDINARY env vars are set)
router.post('/upload-cloud', authenticate, restrictTo('Admin'), async (req, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(501).json({ message: 'Cloud storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_SECRET.' });
  }

  galleryUpload.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const { albumId } = req.body;
      if (!albumId) {
        return res.status(400).json({ message: 'Album ID is required' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Please upload an image file' });
      }

      const album = await prisma.album.findUnique({ where: { id: albumId } });
      if (!album) {
        return res.status(404).json({ message: 'Album not found' });
      }

      const isApproved = req.user.role === 'Admin';
      const photoUrl = req.file.path; // Cloudinary URL

      const photo = await prisma.photo.create({
        data: {
          albumId,
          photoUrl,
          uploadedBy: req.user.id,
          isApproved,
          approvedBy: isApproved ? req.user.id : null
        }
      });

      res.status(201).json({
        status: 'success',
        message: isApproved ? 'Photo uploaded to cloud and displayed successfully' : 'Photo submitted for moderation.',
        data: photo
      });
    } catch (error) {
      res.status(500).json({ message: 'Cloud upload failed', error: error.message });
    }
  });
});

module.exports = router;
