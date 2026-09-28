const express = require('express');
const router = express.Router();
const { getGlobalHeader, updateGlobalHeader } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to view global header
router.get('/global-header', getGlobalHeader);

// Super admin ONLY route to customize global header
router.put('/global-header', protect, authorize('superadmin'), updateGlobalHeader);

module.exports = router;
