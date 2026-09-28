const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : 'student';
    const userId = req.user ? req.user._id : null;

    const query = {
      $or: [
        { targetRole: 'all' },
        { targetRole: userRole },
        ...(userId ? [{ recipient: userId }] : []),
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('issueId', 'title category status severity');

    const formattedNotifications = notifications.map((n) => {
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
