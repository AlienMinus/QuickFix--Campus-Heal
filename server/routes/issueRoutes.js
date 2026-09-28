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

const uploadStatusMedia = upload.fields([
  { name: 'resolutionMedia', maxCount: 1 },
  { name: 'resolutionProofImage', maxCount: 1 },
  { name: 'media', maxCount: 1 },
]);

router.route('/:id/status')
  .put(optionalAuth, uploadStatusMedia, updateIssueStatus)
  .patch(optionalAuth, uploadStatusMedia, updateIssueStatus);
router.post('/:id/upvote', optionalAuth, upvoteIssue);
router.put('/:id/assign', protect, authorize('staff', 'admin'), assignIssue);

module.exports = router;
