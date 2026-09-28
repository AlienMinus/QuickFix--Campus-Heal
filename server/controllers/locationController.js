const LocationLog = require('../models/LocationLog');
const User = require('../models/User');

const CAMPUS_ZONES = [
  { name: 'Main Academic Block (MAB)', lat: 20.2195, lng: 85.7360, radius: 80 },
  { name: 'Engineering & Computing Labs', lat: 20.2198, lng: 85.7365, radius: 70 },
  { name: 'Central Library & Reading Hall', lat: 20.2192, lng: 85.7358, radius: 60 },
  { name: 'Boys Hostel Complex', lat: 20.2188, lng: 85.7350, radius: 90 },
  { name: 'Girls Hostel Complex', lat: 20.2202, lng: 85.7355, radius: 90 },
  { name: 'Cafeteria & Food Court', lat: 20.2190, lng: 85.7368, radius: 60 },
  { name: 'Sports Complex & Athletic Ground', lat: 20.2182, lng: 85.7362, radius: 100 },
  { name: 'Administrative Building & Dean Office', lat: 20.2196, lng: 85.7354, radius: 60 },
];

const detectCampusZone = (lat, lng) => {
  for (const zone of CAMPUS_ZONES) {
    const latDiff = Math.abs(zone.lat - lat) * 111000;
    const lngDiff = Math.abs(zone.lng - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    if (dist <= zone.radius) {
      return zone.name;
    }
  }
  return 'GIFT Autonomous Campus (Bhubaneswar)';
};

exports.logLocation = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude,
      batteryLevel,
      customUserName,
      customRole,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const campusZone = detectCampusZone(lat, lng);

    const userId = req.user ? req.user._id : null;
    const userName = req.user ? req.user.name : (customUserName || 'Anonymous Campus Explorer');
    const userRole = req.user ? req.user.role : (customRole || 'student');

    const logEntry = await LocationLog.create({
      userId,
      userName,
      userRole,
      latitude: lat,
      longitude: lng,
      accuracy: accuracy ? parseFloat(accuracy) : 0,
      speed: speed ? parseFloat(speed) : 0,
      heading: heading ? parseFloat(heading) : 0,
      altitude: altitude ? parseFloat(altitude) : 0,
      campusZone,
      batteryLevel: batteryLevel ? parseFloat(batteryLevel) : null,
      loggedAt: new Date(),
    });

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        lastActiveLocation: {
          latitude: lat,
          longitude: lng,
          updatedAt: new Date(),
        },
      });
    }

    return res.status(201).json({
      success: true,
      loggedAt: logEntry.loggedAt,
      zone: campusZone,
      logId: logEntry._id,
    });
  } catch (error) {
    console.error('Location Log Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLatestLocations = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 60 * 1000);

    const latestLogs = await LocationLog.aggregate([
      { $match: { loggedAt: { $gte: since } } },
      { $sort: { loggedAt: -1 } },
      {
        $group: {
          _id: { $ifNull: ['$userId', '$userName'] },
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);

    return res.status(200).json({
      success: true,
      count: latestLogs.length,
      locations: latestLogs,
    });
  } catch (error) {
    console.error('Get Latest Locations Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLocationHistory = async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const query = isObjectId
      ? { userId: identifier }
      : { userName: identifier };

    const history = await LocationLog.find(query)
      .sort({ loggedAt: -1 })
      .limit(60);

    return res.status(200).json({
      success: true,
      count: history.length,
      history: history.reverse(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCampusZones = (req, res) => {
  return res.status(200).json({
    success: true,
    campus: 'Gandhi Institute For Technology (GIFT Autonomous), Bhubaneswar',
    center: { lat: 20.2195, lng: 85.7360 },
    zones: CAMPUS_ZONES,
  });
};
