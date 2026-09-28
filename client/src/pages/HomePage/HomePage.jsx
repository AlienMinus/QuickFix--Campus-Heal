import React, { useState, useEffect } from 'react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import LocationTracker from '../../components/LocationTracker/LocationTracker';
import IssueCard from '../../components/IssueCard/IssueCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FaPlusCircle,
  FaMapMarkedAlt,
  FaCheckCircle,
  FaSpinner,
  FaClock,
  FaSearch,
  FaUniversity,
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

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    fetchIssues();
  }, [selectedCategory]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues', {
        params: {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: searchQuery || undefined,
        },
      });

      if (res.data && res.data.issues) {
        setIssues(res.data.issues);
        const all = res.data.issues;
        setStats({
          total: all.length,
          submitted: all.filter((i) => i.status === 'Submitted').length,
          inProgress: all.filter((i) => i.status === 'In Progress').length,
          resolved: all.filter((i) => i.status === 'Resolved').length,
        });
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
      <div className="campus-hero-banner">
        <div className="hero-top">
          <div className="event-pill">
            <FaUniversity /> BPUT Tech Carnival 2026 • GIFT Autonomous
          </div>
          <span className="live-status-pill">Active QuickFix</span>
        </div>
        <h1 className="hero-title">Smart Campus QuickFix</h1>
        <p className="hero-subtitle">
          Hello, {user?.name || 'Campus Member'}! Identify, report, and track campus maintenance concerns in real-time.
        </p>

        <div className="hero-action-tiles">
          <button className="action-tile report" onClick={() => navigate('/report')}>
            <FaPlusCircle className="tile-icon" />
            <div className="tile-text">
              <span className="tile-title">Report Issue</span>
              <span className="tile-sub">Photo, GPS & QR auto-fill</span>
            </div>
          </button>

          <button className="action-tile map" onClick={() => navigate('/map')}>
            <FaMapMarkedAlt className="tile-icon" />
            <div className="tile-text">
              <span className="tile-title">Live Campus Map</span>
              <span className="tile-sub">1s GPS patrol & pins</span>
            </div>
          </button>
        </div>
      </div>

      <LocationTracker />

      <div className="kpi-summary-row">
        <div className="kpi-card submitted" onClick={() => navigate('/track?status=Submitted')}>
          <div className="kpi-icon"><FaClock /></div>
          <div className="kpi-data">
            <span className="kpi-num">{stats.submitted}</span>
            <span className="kpi-lbl">Submitted</span>
          </div>
        </div>

        <div className="kpi-card in-progress" onClick={() => navigate('/track?status=In Progress')}>
          <div className="kpi-icon"><FaSpinner className="spin-slow" /></div>
          <div className="kpi-data">
            <span className="kpi-num">{stats.inProgress}</span>
            <span className="kpi-lbl">In Progress</span>
          </div>
        </div>

        <div className="kpi-card resolved" onClick={() => navigate('/track?status=Resolved')}>
          <div className="kpi-icon"><FaCheckCircle /></div>
          <div className="kpi-data">
            <span className="kpi-num">{stats.resolved}</span>
            <span className="kpi-lbl">Resolved</span>
          </div>
        </div>
      </div>

      <div className="feed-controls">
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
                fetchIssues();
              }}
            >
              ×
            </button>
          )}
        </form>

        <div className="categories-scroll-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="issues-feed-section">
        <div className="feed-header">
          <h2 className="feed-title">
            {selectedCategory === 'All' ? 'Campus Issues Feed' : selectedCategory}
          </h2>
          <span className="feed-count">{issues.length} reported</span>
        </div>

        {loading ? (
          <div className="feed-loading-state">
            <div className="spinner-ring" />
            <p>Loading campus issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-feed-card">
            <FaCheckCircle className="empty-icon" />
            <h3>No issues found in this category</h3>
            <p>Everything looks great! Or report a new campus concern to get it resolved quickly.</p>
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
