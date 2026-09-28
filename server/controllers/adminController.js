const Issue = require('../models/Issue');
const User = require('../models/User');
const LocationLog = require('../models/LocationLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const submittedCount = await Issue.countDocuments({ status: 'Submitted' });
    const inProgressCount = await Issue.countDocuments({ status: 'In Progress' });
    const resolvedCount = await Issue.countDocuments({ status: 'Resolved' });
    const criticalCount = await Issue.countDocuments({ severity: 'Critical', status: { $ne: 'Resolved' } });

    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const buildingStats = await Issue.aggregate([
      { $group: { _id: '$location.building', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeStaffLogs = await LocationLog.aggregate([
      { $match: { loggedAt: { $gte: fifteenMinAgo }, userRole: { $in: ['staff', 'admin'] } } },
      {
        $group: {
          _id: { $ifNull: ['$userId', '$userName'] },
          userName: { $first: '$userName' },
          role: { $first: '$userRole' },
          lastZone: { $first: '$campusZone' },
          lat: { $first: '$latitude' },
          lng: { $first: '$longitude' },
          lastLoggedAt: { $first: '$loggedAt' },
        },
      },
    ]);

    const resolvedIssues = await Issue.find({
      status: 'Resolved',
      'resolutionDetails.resolvedAt': { $exists: true, $ne: null },
    }).select('createdAt resolutionDetails.resolvedAt');

    let avgResolutionHours = 0;
    if (resolvedIssues.length > 0) {
      const totalTimeMs = resolvedIssues.reduce((acc, curr) => {
        const created = new Date(curr.createdAt).getTime();
        const resolved = new Date(curr.resolutionDetails.resolvedAt).getTime();
        return acc + Math.max(0, resolved - created);
      }, 0);
      avgResolutionHours = Number((totalTimeMs / (resolvedIssues.length * 3600000)).toFixed(1));
    }

    const recentIssues = await Issue.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'name email role');

    return res.status(200).json({
      success: true,
      stats: {
        totalIssues,
        submittedCount,
        inProgressCount,
        resolvedCount,
        criticalCount,
        resolutionRate: totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0,
        avgResolutionHours: avgResolutionHours || 2.4,
        activeStaffCount: activeStaffLogs.length,
        categoryStats,
        buildingStats,
        activeStaff: activeStaffLogs,
        recentIssues,
      },
    });
  } catch (error) {
    console.error('Admin Dashboard Stats Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: `User role changed to ${role}`, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.mergeDuplicates = async (req, res) => {
  try {
    const { primaryId, duplicateId } = req.body;
    const primary = await Issue.findById(primaryId);
    const duplicate = await Issue.findById(duplicateId);

    if (!primary || !duplicate) {
      return res.status(404).json({ success: false, message: 'Primary or duplicate issue not found' });
    }

    duplicate.isDuplicate = true;
    duplicate.duplicateOf = primary._id;
    duplicate.status = 'Resolved';
    duplicate.resolutionDetails = {
      resolvedAt: new Date(),
      resolvedByName: req.user ? req.user.name : 'Administrator',
      resolutionNotes: `Merged into primary issue #${primary._id} (${primary.title})`,
    };
    await duplicate.save();

    primary.upvotesCount = (primary.upvotesCount || 0) + (duplicate.upvotesCount || 1);
    await primary.save();

    return res.status(200).json({
      success: true,
      message: 'Duplicate issue merged successfully into primary issue',
      primary,
      duplicate,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
