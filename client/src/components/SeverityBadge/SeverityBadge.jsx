import React from 'react';
import './SeverityBadge.css';
import {
  FaInfoCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaFire,
} from 'react-icons/fa';

const SeverityBadge = ({ severity = 'Medium', size = 'normal' }) => {
  const getSeverityConfig = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return {
          icon: <FaFire />,
          label: 'Critical',
          className: 'severity-critical',
        };
      case 'high':
        return {
          icon: <FaExclamationTriangle />,
          label: 'High',
          className: 'severity-high',
        };
      case 'low':
        return {
          icon: <FaInfoCircle />,
          label: 'Low',
          className: 'severity-low',
        };
      case 'medium':
      default:
        return {
          icon: <FaExclamationCircle />,
          label: 'Medium',
          className: 'severity-medium',
        };
    }
  };

  const config = getSeverityConfig(severity);

  return (
    <span className={`severity-badge ${config.className} size-${size}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.label}</span>
    </span>
  );
};

export default SeverityBadge;
