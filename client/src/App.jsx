import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import BottomNav from './components/BottomNav/BottomNav';
import DeviceFrameToggle from './components/DeviceFrameToggle/DeviceFrameToggle';
import HomePage from './pages/HomePage/HomePage';
import ReportIssuePage from './pages/ReportIssuePage/ReportIssuePage';
import IssueTrackingPage from './pages/IssueTrackingPage/IssueTrackingPage';
import IssueDetailPage from './pages/IssueDetailPage/IssueDetailPage';
import LiveMapPage from './pages/LiveMapPage/LiveMapPage';
import AdminDashboardPage from './pages/AdminDashboardPage/AdminDashboardPage';
import StaffDashboardPage from './pages/StaffDashboardPage/StaffDashboardPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user, isAdmin, isStaff } = useAuth();
  const [isFrameMode, setIsFrameMode] = useState(false);

  return (
    <div className={`app-outer-wrapper ${isFrameMode ? 'frame-mode-active' : 'fullscreen-mode'}`}>
      <DeviceFrameToggle
        isFrameMode={isFrameMode}
        onToggle={(val) => setIsFrameMode(val)}
      />

      <div className={`device-viewport ${isFrameMode ? 'device-frame' : ''}`}>
        {isFrameMode && (
          <div className="phone-notch-bar">
            <span className="phone-time">09:41</span>
            <div className="phone-camera-lens" />
            <div className="phone-status-icons">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        <Navbar />

        <main className="main-content-scrollable">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report" element={<ReportIssuePage />} />
            <Route path="/track" element={<IssueTrackingPage />} />
            <Route path="/issues" element={<IssueTrackingPage />} />
            <Route path="/issue/:id" element={<IssueDetailPage />} />
            <Route path="/issues/:id" element={<IssueDetailPage />} />
            <Route path="/map" element={<LiveMapPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/staff" element={<StaffDashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav />

        {isFrameMode && <div className="phone-home-indicator" />}
      </div>
    </div>
  );
}

export default App;
