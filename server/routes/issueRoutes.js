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
  deleteIssue,
} = require('../controllers/issueController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

const uploadIssueMedia = upload.fields([
  { name: 'media', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

router.route('/')
  .post(optionalAuth, uploadIssueMedia, createIssue)
  .get(optionalAuth, getIssues);

router.post('/check-duplicates', checkDuplicates);

router.route('/:id')
  .get(getIssueById)
  .delete(protect, authorize('admin', 'superadmin'), deleteIssue);

const uploadStatusMedia = upload.fields([
  { name: 'resolutionMedia', maxCount: 1 },
  { name: 'resolutionProofImage', maxCount: 1 },
  { name: 'resolutionVideo', maxCount: 1 },
  { name: 'media', maxCount: 1 },
]);

router.route('/:id/status')
  .put(optionalAuth, uploadStatusMedia, updateIssueStatus)
  .patch(optionalAuth, uploadStatusMedia, updateIssueStatus);
router.post('/:id/upvote', optionalAuth, upvoteIssue);
router.put('/:id/assign', protect, authorize('staff', 'admin', 'superadmin'), assignIssue);
router.patch('/:id/assign', protect, authorize('staff', 'admin', 'superadmin'), assignIssue);

module.exports = router;
