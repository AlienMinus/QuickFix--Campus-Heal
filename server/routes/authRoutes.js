const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  demoLogin,
  updateAvatar,
  removeAvatar,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', protect, getMe);

router.put('/avatar', protect, upload.single('avatar'), updateAvatar);
router.delete('/avatar', protect, removeAvatar);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

module.exports = router;
