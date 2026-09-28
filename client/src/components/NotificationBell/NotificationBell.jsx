import React, { useState, useEffect } from 'react';
import './NotificationBell.css';
import { FaBell, FaCheck, FaExclamationTriangle, FaInfoCircle, FaWrench } from 'react-icons/fa';
import api from '../../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      const mockNotifications = [
        {
          _id: 'n1',
          title: 'Campus Issue Update',
          message: 'Water leakage at MAB Ground Floor Restroom status changed to In Progress.',
          type: 'issue_status',
          read: false,
          createdAt: new Date(),
        },
        {
          _id: 'n2',
          title: 'Patrol Active',
          message: 'Maintenance crew dispatched for BPUT Tech Carnival 2026 venue check.',
          type: 'assignment',
          read: true,
          createdAt: new Date(Date.now() - 3600000),
        },
      ];
      setNotifications(mockNotifications);
      setUnreadCount(1);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'critical_alert') return <FaExclamationTriangle className="notif-icon critical" />;
    if (type === 'assignment') return <FaWrench className="notif-icon assign" />;
    return <FaInfoCircle className="notif-icon info" />;
  };

  return (
    <div className="notification-bell-container">
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notif-header">
            <span className="notif-header-title">Live Campus Alerts</span>
            <span className="notif-header-count">{unreadCount} new</span>
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="empty-notif">No new campus notifications</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={`notif-item ${item.read ? 'read' : 'unread'}`}
                  onClick={() => markRead(item._id)}
                >
                  <div className="notif-item-icon">{getTypeIcon(item.type)}</div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{item.title}</div>
                    <div className="notif-item-msg">{item.message}</div>
                    <div className="notif-item-time">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!item.read && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
