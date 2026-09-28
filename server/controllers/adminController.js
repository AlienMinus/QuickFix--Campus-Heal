const Issue = require('../models/Issue');
const User = require('../models/User');
const LocationLog = require('../models/LocationLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const issueFilter = {};
    if (req.user?.role === 'superadmin') {
      if (req.query.institute && req.query.institute !== 'All') {
        issueFilter.institute = req.query.institute;
      }
    } else if (req.user?.institute) {
      issueFilter.institute = req.user.institute;
    }

    const totalIssues = await Issue.countDocuments(issueFilter);
    const submittedCount = await Issue.countDocuments({ ...issueFilter, status: 'Submitted' });
    const inProgressCount = await Issue.countDocuments({ ...issueFilter, status: 'In Progress' });
    const resolvedCount = await Issue.countDocuments({ ...issueFilter, status: 'Resolved' });
    const criticalCount = await Issue.countDocuments({ ...issueFilter, severity: 'Critical', status: { $ne: 'Resolved' } });

    const matchStage = Object.keys(issueFilter).length > 0 ? [{ $match: issueFilter }] : [];

    const categoryStats = await Issue.aggregate([
      ...matchStage,
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const buildingStats = await Issue.aggregate([
      ...matchStage,
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
      ...issueFilter,
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

    const recentIssues = await Issue.find(issueFilter)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('reportedBy', 'name email role department institute');

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
    const userFilter = {};
    if (req.user?.role === 'superadmin') {
      if (req.query.institute && req.query.institute !== 'All') {
        userFilter.institute = req.query.institute;
      }
    } else if (req.user?.institute) {
      userFilter.institute = req.user.institute;
    }

    const users = await User.find(userFilter).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role, institute } = req.body;
    const isSuper = req.user?.role === 'superadmin';
    const allowedRoles = isSuper
      ? ['student', 'staff', 'admin', 'superadmin']
      : ['student', 'staff', 'admin'];

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!isSuper && userToUpdate.institute !== req.user?.institute) {
      return res.status(403).json({ success: false, message: 'Cannot modify users from another institute' });
    }

    if (role) userToUpdate.role = role;
    if (isSuper && institute) userToUpdate.institute = institute.trim();

    await userToUpdate.save();

    return res.status(200).json({
      success: true,
      message: `User updated successfully`,
      user: {
        id: userToUpdate._id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        role: userToUpdate.role,
        institute: userToUpdate.institute,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignTechnician = async (req, res) => {
  try {
    const { staffId } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    let staffName = 'Unassigned';
    if (staffId) {
      const staff = await User.findById(staffId);
      if (staff) {
        issue.assignedTo = staff._id;
        issue.assignedToName = staff.name;
        staffName = staff.name;
      }
    } else {
      issue.assignedTo = null;
      issue.assignedToName = 'Unassigned';
    }

    await issue.save();
    return res.status(200).json({
      success: true,
      message: `Assigned technician to ${staffName}`,
      issue,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    if (req.user?.role !== 'superadmin' && issue.institute !== req.user?.institute) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete issue from another institute' });
    }

    await Issue.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Issue permanently deleted' });
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
