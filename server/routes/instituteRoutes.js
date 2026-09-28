const express = require('express');
const router = express.Router();
const {
  getInstitutes,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  getSuperAdminOverview,
} = require('../controllers/instituteController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for registration dropdown & campus selection
router.get('/', getInstitutes);

// Super Admin protected routes
router.get('/superadmin/overview', protect, authorize('superadmin'), getSuperAdminOverview);
router.post('/', protect, authorize('superadmin'), createInstitute);
router.put('/:id', protect, authorize('superadmin'), updateInstitute);
router.delete('/:id', protect, authorize('superadmin'), deleteInstitute);

module.exports = router;
