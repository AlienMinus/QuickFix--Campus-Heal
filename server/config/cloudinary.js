const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let upload;

if (isCloudinaryConfigured) {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype
        ? file.mimetype.startsWith('video/')
        : /\.(mp4|mov|webm|mkv|avi)$/i.test(file.originalname || '');
      return {
        folder: 'smart_campus_quickfix',
        resource_type: isVideo ? 'video' : 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'mp4', 'webm', 'mov', 'mkv', 'avi'],
        ...(isVideo ? {} : { transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }] }),
      };
    },
  });
  upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB to accommodate video evidence
  });
} else {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const isVideo = file.mimetype ? file.mimetype.startsWith('video/') : false;
      const defaultExt = isVideo ? '.mp4' : '.jpg';
      const ext = path.extname(file.originalname) || defaultExt;
      cb(null, `evidence-${uniqueSuffix}${ext}`);
    },
  });

  upload = multer({
    storage: localStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB to accommodate video evidence
  });
}

const getMediaUrl = (req, file) => {
  if (!file) return null;
  const isVideo = file.mimetype
    ? file.mimetype.startsWith('video/')
    : /\.(mp4|mov|webm|mkv|avi)$/i.test(file.originalname || file.filename || file.path || '');
  const mediaType = isVideo ? 'video' : 'image';

  if (file.path && file.path.startsWith('http')) {
    return {
      url: file.path,
      publicId: file.filename || file.public_id || null,
      provider: 'cloudinary',
      mediaType,
    };
  }
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return {
    url: `${protocol}://${host}/uploads/${file.filename}`,
    publicId: file.filename,
    provider: 'local-fallback',
    mediaType,
  };
};

module.exports = {
  cloudinary,
  upload,
  isCloudinaryConfigured,
  getMediaUrl,
};
