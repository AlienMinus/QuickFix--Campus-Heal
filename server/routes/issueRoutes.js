const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  upvoteIssue,
  assignIssue,
  checkDuplicates,
} = require('../controllers/issueController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
  .post(optionalAuth, upload.single('media'), createIssue)
  .get(optionalAuth, getIssues);

router.post('/check-duplicates', checkDuplicates);

router.route('/:id')
  .get(getIssueById);

router.put('/:id/status', optionalAuth, upload.single('resolutionMedia'), updateIssueStatus);
router.post('/:id/upvote', optionalAuth, upvoteIssue);
router.put('/:id/assign', protect, authorize('staff', 'admin'), assignIssue);

module.exports = router;
