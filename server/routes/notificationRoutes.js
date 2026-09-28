const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { optionalAuth, protect } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getNotifications);
router.route('/:id/read')
  .put(optionalAuth, markAsRead)
  .patch(optionalAuth, markAsRead);

module.exports = router;
