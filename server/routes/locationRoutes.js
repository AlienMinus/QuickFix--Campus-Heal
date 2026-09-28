const express = require('express');
const router = express.Router();
const {
  logLocation,
  getLatestLocations,
  getLocationHistory,
  getCampusZones,
} = require('../controllers/locationController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/log', optionalAuth, logLocation);
router.get('/latest', getLatestLocations);
router.get('/history/:identifier', getLocationHistory);
router.get('/zones', getCampusZones);

module.exports = router;
