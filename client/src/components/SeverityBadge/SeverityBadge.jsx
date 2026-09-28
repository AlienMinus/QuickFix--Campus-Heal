import React from 'react';
import './SeverityBadge.css';
import {
  FaInfoCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaFire,
} from 'react-icons/fa';

const SeverityBadge = ({ severity = 'Medium', size = 'normal', compact = false, iconOnly = false }) => {
  const getSeverityConfig = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return {
          icon: <FaFire />,
          label: compact ? 'CRIT' : 'Critical',
          className: 'severity-critical',
          title: 'Critical Severity',
        };
      case 'high':
        return {
          icon: <FaExclamationTriangle />,
          label: compact ? 'HIGH' : 'High',
          className: 'severity-high',
          title: 'High Severity',
        };
      case 'low':
        return {
          icon: <FaInfoCircle />,
          label: compact ? 'LOW' : 'Low',
          className: 'severity-low',
          title: 'Low Severity',
        };
      case 'medium':
      default:
        return {
          icon: <FaExclamationCircle />,
          label: compact ? 'MED' : 'Medium',
          className: 'severity-medium',
          title: 'Medium Severity',
        };
    }
  };

  const config = getSeverityConfig(severity);

  return (
    <span
      className={`severity-badge ${config.className} size-${size} ${compact ? 'is-compact' : ''} ${iconOnly ? 'icon-only' : ''}`}
      title={config.title}
    >
      <span className="badge-icon">{config.icon}</span>
      {!iconOnly && <span className="badge-text">{config.label}</span>}
    </span>
  );
};

export default SeverityBadge;
