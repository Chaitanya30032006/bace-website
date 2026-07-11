const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const isCloudinaryConfigured = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET);
};

// Gallery photo storage
const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bace/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  }
});

// Profile photo storage
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bace/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }]
  }
});

const galleryUpload = multer({
  storage: galleryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  galleryUpload,
  profileUpload
};
