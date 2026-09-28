const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(optionalAuth, getCategories)
  .post(protect, authorize('superadmin'), createCategory);

router.route('/:id')
  .put(protect, authorize('superadmin'), updateCategory)
  .delete(protect, authorize('superadmin'), deleteCategory);

module.exports = router;
