const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const userRole = user ? user.role : 'student';
    const userId = user ? user._id : null;
    const userInstitute = (user?.institute || req.query.institute || '').trim();

    let query = {};

    if (userRole === 'superadmin') {
      // Super admin can oversee all platform alerts or query-filtered institute
      if (req.query.institute) {
        query.institute = new RegExp(`^${req.query.institute.trim()}$`, 'i');
      }
    } else if (userInstitute) {
      // Regular campus member (student, staff, admin):
      // Confine strictly to user's institute
      const instituteRegex = new RegExp(`^${userInstitute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

      query = {
        $and: [
          { institute: instituteRegex },
          {
            $or: [
              ...(userId ? [{ recipient: userId }] : []),
              {
                targetRole: { $in: ['all', userRole] },
                recipient: { $in: [null, undefined] },
              },
            ],
          },
        ],
      };
    } else {
      // Unauthenticated guest or unknown institute
      return res.status(200).json({
        success: true,
        count: 0,
        notifications: [],
      });
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('issueId', 'title category status severity institute');

    // Strict boundary enforcement against any edge cases
    const filteredNotifications = notifications.filter((n) => {
      if (userRole === 'superadmin') return true;
      const notifInstitute = n.institute || n.issueId?.institute;
      if (!notifInstitute || !userInstitute) return false;
      if (notifInstitute.trim().toLowerCase() !== userInstitute.toLowerCase()) {
        return false;
      }
      if (n.targetRole === 'personal' || n.recipient) {
        return userId && n.recipient && n.recipient.toString() === userId.toString();
      }
      return n.targetRole === 'all' || n.targetRole === userRole;
    });

    const formattedNotifications = filteredNotifications.map((n) => {
      const item = n.toObject ? n.toObject() : { ...n };
      if (item.message) {
        item.message = item.message
          .replace(/You have been assigned to resolve an issue/gi, 'Technician has been assigned to resolve the issue')
          .replace(/You have been assigned to resolve/gi, 'Task has been assigned for resolution')
          .replace(/You have been assigned/gi, 'Task has been assigned')
          .replace(/Your reported issue status has been updated to/gi, 'Reported issue status has been updated to')
          .replace(/\bYour reported issue\b/gi, 'Reported issue')
          .replace(/\bYour issue\b/gi, 'Issue');
      }
      return item;
    });

    return res.status(200).json({
      success: true,
      count: formattedNotifications.length,
      notifications: formattedNotifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
