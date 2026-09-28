const express = require('express');
const router = express.Router();
const {
  getInstitutes,
  getInstitutesWithAdmins,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  getSuperAdminOverview,
  getMyInstitute,
  updateMyInstituteHeader,
  getMyInstituteBranches,
  updateMyInstituteBranches,
  getInstituteBranches,
} = require('../controllers/instituteController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for registration dropdown & campus selection
router.get('/', getInstitutes);
router.get('/branches/:identifier', getInstituteBranches);

// Normal Admin routes (for their own institute)
router.get('/my-institute', protect, authorize('admin', 'superadmin'), getMyInstitute);
router.put('/my-institute/header', protect, authorize('admin', 'superadmin'), updateMyInstituteHeader);
router.get('/my-institute/branches', protect, authorize('admin', 'superadmin'), getMyInstituteBranches);
router.put('/my-institute/branches', protect, authorize('admin', 'superadmin'), updateMyInstituteBranches);

// Super Admin protected routes
router.get('/superadmin/overview', protect, authorize('superadmin'), getSuperAdminOverview);
router.get('/with-admins', protect, authorize('superadmin'), getInstitutesWithAdmins);
router.post('/', protect, authorize('superadmin'), createInstitute);
router.put('/:id', protect, authorize('superadmin'), updateInstitute);
router.delete('/:id', protect, authorize('superadmin'), deleteInstitute);

module.exports = router;
