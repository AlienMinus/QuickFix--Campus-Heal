const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  assignTechnician,
  deleteIssue,
  mergeDuplicates,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Stats endpoints (supports both /dashboard-stats and /stats)
router.get('/dashboard-stats', getDashboardStats);
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.patch('/users/:id/role', updateUserRole);

// Issue management
router.patch('/issues/:id/assign', assignTechnician);
router.put('/issues/:id/assign', assignTechnician);
router.delete('/issues/:id', deleteIssue);

router.post('/merge-duplicates', mergeDuplicates);

module.exports = router;
