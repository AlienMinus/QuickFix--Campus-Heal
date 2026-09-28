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

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
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
