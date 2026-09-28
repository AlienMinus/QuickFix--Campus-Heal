const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const { getMediaUrl } = require('../config/cloudinary');

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

exports.createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      building,
      room,
      landmark,
      latitude,
      longitude,
      qrCodeTag,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Please provide title, description and category' });
    }

    let mediaData = {
      url: '',
      publicId: '',
      provider: 'none',
    };

    if (req.file) {
      const media = getMediaUrl(req, req.file);
      if (media) {
        mediaData = media;
      }
    } else if (req.body.mediaUrl) {
      mediaData = {
        url: req.body.mediaUrl,
        publicId: '',
        provider: 'direct-url',
      };
    }

    const lat = latitude ? parseFloat(latitude) : 20.2195;
    const lng = longitude ? parseFloat(longitude) : 85.7360;

    let potentialDuplicate = null;
    const recentIssues = await Issue.find({
      category: category,
      status: { $in: ['Submitted', 'In Progress'] },
    }).limit(20);

    for (const item of recentIssues) {
      if (item.location && item.location.latitude && item.location.longitude) {
        const dist = getDistanceInMeters(lat, lng, item.location.latitude, item.location.longitude);
        if (dist <= 60) {
          potentialDuplicate = item;
          break;
        }
      }
      if (room && item.location.room && item.location.room.toLowerCase() === room.toLowerCase()) {
        potentialDuplicate = item;
        break;
      }
    }

    const newIssue = new Issue({
      title,
      description,
      category,
      severity: severity || 'Medium',
      location: {
        building: building || 'Main Academic Block',
        room: room || '',
        landmark: landmark || '',
        latitude: lat,
        longitude: lng,
        qrCodeTag: qrCodeTag || '',
      },
      media: mediaData,
      reportedBy: req.user ? req.user._id : null,
      reportedByName: req.user ? req.user.name : (req.body.reporterName || 'Campus Resident'),
      reportedByEmail: req.user ? req.user.email : '',
      institute: req.user?.institute || req.body.institute || 'BPUT Tech Campus',
      isDuplicate: Boolean(potentialDuplicate),
      duplicateOf: potentialDuplicate ? potentialDuplicate._id : null,
      statusHistory: [
        {
          status: 'Submitted',
          changedAt: new Date(),
          changedBy: req.user ? req.user.name : 'Reporter',
          remarks: 'Issue reported to campus administration',
        },
      ],
    });

    await newIssue.save();

    await Notification.create({
      title: `New ${severity || 'Medium'} Issue: ${title}`,
      message: `Reported at ${building || 'Campus'} (${category})`,
      type: severity === 'Critical' ? 'critical_alert' : 'issue_status',
      targetRole: 'staff',
      issueId: newIssue._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Campus issue recorded successfully',
      issue: newIssue,
      potentialDuplicate: potentialDuplicate
        ? {
            id: potentialDuplicate._id,
            title: potentialDuplicate.title,
            status: potentialDuplicate.status,
          }
        : null,
    });
  } catch (error) {
    console.error('Create Issue Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIssues = async (req, res) => {
  try {
    const { category, status, severity, building, search, myIssues, assignedToMe, sort } = req.query;

    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;
    if (severity && severity !== 'All') filter.severity = severity;
    if (building && building !== 'All') filter['location.building'] = building;

    if (myIssues === 'true' && req.user) {
      filter.reportedBy = req.user._id;
    }

    if (assignedToMe === 'true' && req.user) {
      filter.assignedTo = req.user._id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.building': { $regex: search, $options: 'i' } },
        { 'location.room': { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { priorityScore: -1, createdAt: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'priority') sortOption = { priorityScore: -1 };
    if (sort === 'upvotes') sortOption = { upvotesCount: -1 };

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email avatar role department')
      .populate('assignedTo', 'name email avatar phone department')
      .sort(sortOption);

    return res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    console.error('Get Issues Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email avatar role department')
      .populate('assignedTo', 'name email avatar phone department')
      .populate('duplicateOf', 'title status severity createdAt');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    return res.status(200).json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, remarks, resolutionNotes } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    if (!['Submitted', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const previousStatus = issue.status;
    issue.status = status;

    let resolutionMediaUrl = issue.resolutionDetails ? issue.resolutionDetails.resolutionMediaUrl : '';
    const uploadedFile = req.file || (req.files && (req.files.resolutionMedia?.[0] || req.files.resolutionProofImage?.[0] || req.files.media?.[0]));
    if (uploadedFile) {
      const media = getMediaUrl(req, uploadedFile);
      if (media) resolutionMediaUrl = media.url;
    } else if (req.body.resolutionMediaUrl) {
      resolutionMediaUrl = req.body.resolutionMediaUrl;
    }

    if (status === 'Resolved') {
      issue.resolutionDetails = {
        resolvedAt: new Date(),
        resolvedBy: req.user ? req.user._id : null,
        resolvedByName: req.user ? req.user.name : 'Campus Staff',
        resolutionNotes: resolutionNotes || remarks || 'Issue resolved successfully.',
        resolutionMediaUrl,
      };
    }

    issue.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user ? req.user.name : 'Authorized Staff',
      remarks: remarks || `Status changed from ${previousStatus} to ${status}`,
    });

    await issue.save();

    if (issue.reportedBy) {
      await Notification.create({
        recipient: issue.reportedBy,
        title: `Issue Status Update: ${issue.title}`,
        message: `Your reported issue status has been updated to "${status}".`,
        type: 'issue_status',
        issueId: issue._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      issue,
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upvoteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
      issue.upvotesCount = (issue.upvotesCount || 0) + 1;
    } else {
      const hasUpvoted = issue.upvotes.some((id) => id.toString() === userId.toString());
      if (hasUpvoted) {
        return res.status(200).json({
          success: true,
          message: 'Already reacted to this issue',
          alreadyUpvoted: true,
          upvotesCount: issue.upvotesCount,
        });
      }
      issue.upvotes.push(userId);
      issue.upvotesCount = (issue.upvotesCount || 0) + 1;
    }

    await issue.save();

    return res.status(200).json({
      success: true,
      message: 'Vote updated successfully',
      upvotesCount: issue.upvotesCount,
      priorityScore: issue.priorityScore,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignIssue = async (req, res) => {
  try {
    const { staffId, staffName } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    issue.assignedTo = staffId;
    issue.assignedToName = staffName || 'Assigned Staff';
    if (issue.status === 'Submitted') {
      issue.status = 'In Progress';
      issue.statusHistory.push({
        status: 'In Progress',
        changedAt: new Date(),
        changedBy: req.user ? req.user.name : 'Administrator',
        remarks: `Assigned to ${staffName}`,
      });
    }

    await issue.save();

    if (staffId) {
      await Notification.create({
        recipient: staffId,
        title: `Task Assigned: ${issue.title}`,
        message: `You have been assigned to resolve an issue at ${issue.location.building} (${issue.severity} severity).`,
        type: 'assignment',
        issueId: issue._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Issue assigned to ${staffName}`,
      issue,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkDuplicates = async (req, res) => {
  try {
    const { category, latitude, longitude, building, room } = req.body;
    const lat = parseFloat(latitude) || 20.2195;
    const lng = parseFloat(longitude) || 85.7360;

    const activeIssues = await Issue.find({
      category: category,
      status: { $ne: 'Resolved' },
    }).limit(15);

    const matches = activeIssues.map((item) => {
      let distance = 9999;
      if (item.location && item.location.latitude && item.location.longitude) {
        distance = Math.round(getDistanceInMeters(lat, lng, item.location.latitude, item.location.longitude));
      }
      const sameBuilding = item.location.building && building && item.location.building.toLowerCase() === building.toLowerCase();
      const sameRoom = item.location.room && room && item.location.room.toLowerCase() === room.toLowerCase();

      return {
        _id: item._id,
        title: item.title,
        description: item.description,
        status: item.status,
        severity: item.severity,
        distanceMeters: distance,
        location: item.location,
        media: item.media,
        upvotesCount: item.upvotesCount,
        matchConfidence: distance < 50 || sameRoom ? 'High' : (distance < 120 || sameBuilding ? 'Medium' : 'Low'),
      };
    }).filter(item => item.matchConfidence !== 'Low');

    return res.status(200).json({
      success: true,
      duplicatesFound: matches.length > 0,
      matches,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
