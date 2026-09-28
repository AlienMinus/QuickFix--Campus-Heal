import React, { useState, useEffect } from 'react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import IssueCard from '../../components/IssueCard/IssueCard';
import api from '../../services/api';
import {
  FaPlusCircle,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
} from 'react-icons/fa';

const CATEGORIES = [
  'All',
  'Damaged Infrastructure',
  'Electrical & Lighting',
  'Water Leakage & Plumbing',
  'Cleanliness & Sanitation',
  'Network & Wi-Fi',
  'Lab & Classroom Equipment',
  'Safety & Security Hazard',
];

const STATUSES = ['All', 'Submitted', 'In Progress', 'Resolved'];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Highest Priority' },
  { value: 'newest', label: 'Latest First' },
  { value: 'upvotes', label: 'Most Upvoted' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSort, setSelectedSort] = useState('priority');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchIssues();
  }, [selectedCategory, selectedStatus, selectedSort]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues', {
        params: {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          status: selectedStatus !== 'All' ? selectedStatus : undefined,
          sort: selectedSort,
          search: searchQuery.trim() || undefined,
        },
      });

      if (res.data && res.data.issues) {
        setIssues(res.data.issues);
      }
    } catch (err) {
      console.warn('Issues fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  return (
    <div className="home-page-container">
      {/* 1. Search Bar */}
      <div className="home-search-section">
        <form className="feed-search-form" onSubmit={handleSearchSubmit}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search issues, buildings, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="feed-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setTimeout(fetchIssues, 0);
              }}
            >
              ×
            </button>
          )}
          <button type="submit" className="search-submit-btn">
            Find
          </button>
        </form>

        {/* 2. Unscrollable Dropdown Filters */}
        <div className="unscrollable-filters-row">
          <div className="filter-select-wrapper">
            <FaFilter className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
              title="Filter by Category"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
              title="Filter by Status"
            >
              <option value="All">All Statuses</option>
              {STATUSES.filter((s) => s !== 'All').map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <FaSortAmountDown className="filter-icon" />
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="filter-select"
              title="Sort Order"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Issues Feed Section */}
      <div className="issues-feed-section">
        <div className="feed-header">
          <h2 className="feed-title">
            {selectedCategory === 'All' ? 'Campus Issues Feed' : selectedCategory}
          </h2>
          <span className="feed-count">{issues.length} tickets</span>
        </div>

        {loading ? (
          <div className="feed-loading-state">
            <div className="spinner-ring" />
            <p>Loading campus issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-feed-card">
            <FaCheckCircle className="empty-icon" />
            <h3>No issues found</h3>
            <p>No active campus concerns matching your filters.</p>
            <button className="primary-report-btn" onClick={() => navigate('/report')}>
              <FaPlusCircle /> Report New Issue
            </button>
          </div>
        ) : (
          <div className="issues-list">
            {issues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onUpvoteChange={(id, newVotes) => {
                  setIssues((prev) =>
                    prev.map((item) =>
                      item._id === id ? { ...item, upvotesCount: newVotes } : item
                    )
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
