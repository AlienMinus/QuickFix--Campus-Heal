import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI } from '../../services/api';
import IssueCard from '../../components/IssueCard/IssueCard';
import {
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaSync,
  FaPlusCircle,
  FaLayerGroup,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import './IssueTrackingPage.css';

const CATEGORIES = [
  'All',
  'Electrical',
  'Plumbing',
  'Infrastructure',
  'Sanitation',
  'IT/Network',
  'Safety/Security',
  'Academic Facilities'
];

const STATUS_TABS = [
  { id: 'all', label: 'All Tickets' },
  { id: 'Submitted', label: 'Reported' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Resolved', label: 'Resolved' }
];

export default function IssueTrackingPage() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'upvotes' | 'newest'

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (severityFilter !== 'All') params.severity = severityFilter;
      if (sortBy) params.sort = sortBy;

      const res = await issueAPI.getAll(params);
      setIssues(res.data.issues || []);
    } catch (err) {
      setError('Could not load issues. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, categoryFilter, severityFilter, sortBy]);

  // Client-side text search over tickets
  const filteredIssues = useMemo(() => {
    if (!searchTerm.trim()) return issues;
    const term = searchTerm.toLowerCase();
    return issues.filter(issue => 
      issue.title?.toLowerCase().includes(term) ||
      issue.locationName?.toLowerCase().includes(term) ||
      issue.category?.toLowerCase().includes(term) ||
      issue.trackingId?.toLowerCase().includes(term) ||
      issue.description?.toLowerCase().includes(term)
    );
  }, [issues, searchTerm]);

  // Status counts for quick filter tabs
  const counts = useMemo(() => {
    return {
      all: issues.length,
      submitted: issues.filter(i => i.status === 'Submitted' || i.status === 'Under Review').length,
      inProgress: issues.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length,
      resolved: issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length
    };
  }, [issues]);

  const handleUpvoted = (updatedIssue) => {
    setIssues(prev =>
      prev.map(i => (i._id === updatedIssue._id ? updatedIssue : i))
    );
  };

  return (
    <div className="tracking-page-container">
      {/* Top Header */}
      <div className="tracking-header">
        <div className="header-titles">
          <h1>Campus Issue Tracker</h1>
          <p>Real-time civic tickets, smart prioritization & crowd verification</p>
        </div>
        <button
          className="create-ticket-btn"
          onClick={() => navigate('/report')}
        >
          <FaPlusCircle /> File New Issue
        </button>
      </div>

      {/* Search & Sort Controls */}
      <div className="controls-card">
        <div className="search-bar-wrap">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tickets by title, lab, room, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        <div className="filters-row">
          <div className="filter-item">
            <FaLayerGroup className="filter-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="control-select"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <FaExclamationTriangle className="filter-icon" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="control-select"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-item">
            <FaSortAmountDown className="filter-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              <option value="priority">Smart Priority Score</option>
              <option value="upvotes">Most Upvoted</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <button
            className="refresh-btn"
            onClick={fetchIssues}
            title="Refresh tickets"
          >
            <FaSync className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Status Filter Dropdown (Zero Horizontal Scrolling) */}
      <div className="status-nav-container">
        <div className="status-dropdown-wrap">
          <label htmlFor="status-select-nav" className="status-nav-label">
            <FaFilter /> Status Filter:
          </label>
          <select
            id="status-select-nav"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-nav-select"
          >
            {STATUS_TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket List View */}
      {error && (
        <div className="error-alert">
          <FaExclamationTriangle />
          <span>{error}</span>
          <button onClick={fetchIssues} className="retry-btn">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state-wrapper">
          <div className="spinner-large" />
          <p>Loading campus tickets...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">🎉</div>
          <h3>No Campus Issues Found</h3>
          <p>
            {searchTerm
              ? `No tickets match "${searchTerm}". Try another search term.`
              : 'Everything looks clear in this category! Campus operations are humming.'}
          </p>
          <button
            className="report-now-btn"
            onClick={() => navigate('/report')}
          >
            Report An Issue
          </button>
        </div>
      ) : (
        <div className="issues-list-grid">
          {filteredIssues.map(issue => (
            <IssueCard
              key={issue._id}
              issue={issue}
              onUpvoted={handleUpvoted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
