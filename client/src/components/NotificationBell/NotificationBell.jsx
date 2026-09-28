import React, { useState, useEffect, useRef } from 'react';
import './NotificationBell.css';
import {
  FaBell,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaWrench,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permStatus, setPermStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermStatus(res);
        if (res === 'granted') {
          try {
            new Notification('Campus Alerts Activated', {
              body: 'Live ticket and dispatch notifications are now activated.',
              icon: '/favicon.svg',
            });
          } catch (e) {
            // Android webview silent fallback
          }
        }
      } catch (err) {
        console.warn('Failed to request notification permission:', err);
      }
    }
  };

  const toPassiveSentence = (msg) => {
    if (!msg || typeof msg !== 'string') return msg;
    return msg
      .replace(/You have been assigned to resolve an issue/gi, 'Technician has been assigned to resolve the issue')
      .replace(/You have been assigned to resolve/gi, 'Task has been assigned for resolution')
      .replace(/You have been assigned/gi, 'Task has been assigned')
      .replace(/Your reported issue status has been updated to/gi, 'Reported issue status has been updated to')
      .replace(/\bYour reported issue\b/gi, 'Reported issue')
      .replace(/\bYour issue\b/gi, 'Issue');
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications', {
        params: user?.institute ? { institute: user.institute } : {},
      });
      if (res.data && res.data.notifications) {
        const items = res.data.notifications.map((n) => ({
          ...n,
          message: toPassiveSentence(n.message),
        }));
        setNotifications(items);
        const unread = items.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Fallback alerts for testing
      const mockNotifications = [
        {
          _id: 'n1',
          title: 'Campus Ticket Update',
          message: 'Facility maintenance status updated to In Progress.',
          type: 'issue_status',
          read: false,
          createdAt: new Date(),
        },
        {
          _id: 'n2',
          title: 'Technician Assigned',
          message: 'Maintenance team dispatched to campus zone.',
          type: 'assignment',
          read: true,
          createdAt: new Date(Date.now() - 3600000),
        },
      ];
      setNotifications(mockNotifications);
      setUnreadCount(1);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.institute]);

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
    <div className="notification-bell-container" ref={containerRef}>
      <button
        className="bell-button"
        onClick={() => {
          setIsOpen(!isOpen);
          // If permission is default, ask when user clicks bell
          if (permStatus === 'default') {
            requestPermission();
          }
        }}
        aria-label="Notifications"
        title="Live Campus Notifications"
      >
        <FaBell />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notif-header">
            <span className="notif-header-title">Live Campus Alerts</span>
            <div className="notif-header-badges">
              {unreadCount > 0 && <span className="notif-header-count">{unreadCount} new</span>}
            </div>
          </div>

          {/* Permission Prompt Banner if not granted */}
          {permStatus === 'default' && (
            <div className="notif-permission-banner">
              <div className="perm-info">
                <strong>Enable Alerts</strong>
                <p>Allow notifications to receive real-time ticket updates</p>
              </div>
              <button className="enable-perm-btn" onClick={requestPermission}>
                Allow
              </button>
            </div>
          )}

          {permStatus === 'granted' && (
            <div className="notif-perm-status-chip granted">
              <FaCheckCircle /> Device Push Notifications Active
            </div>
          )}

          {permStatus === 'denied' && (
            <div className="notif-perm-status-chip denied">
              <FaTimesCircle /> Push notifications blocked in device settings
            </div>
          )}

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
