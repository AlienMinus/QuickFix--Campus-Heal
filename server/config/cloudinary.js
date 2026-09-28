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
    params: {
      folder: 'smart_campus_quickfix',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
      transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
    },
  });
  upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
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
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `evidence-${uniqueSuffix}${ext}`);
    },
  });

  upload = multer({
    storage: localStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
}

const getMediaUrl = (req, file) => {
  if (!file) return null;
  if (file.path && file.path.startsWith('http')) {
    return {
      url: file.path,
      publicId: file.filename || file.public_id || null,
      provider: 'cloudinary'
    };
  }
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return {
    url: `${protocol}://${host}/uploads/${file.filename}`,
    publicId: file.filename,
    provider: 'local-fallback'
  };
};

module.exports = {
  cloudinary,
  upload,
  isCloudinaryConfigured,
  getMediaUrl,
};
