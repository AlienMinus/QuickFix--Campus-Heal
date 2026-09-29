import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import Navbar from './components/Navbar/Navbar';
import BottomNav from './components/BottomNav/BottomNav';
import DeviceFrameToggle from './components/DeviceFrameToggle/DeviceFrameToggle';
import HomePage from './pages/HomePage/HomePage';
import ReportIssuePage from './pages/ReportIssuePage/ReportIssuePage';
import IssueTrackingPage from './pages/IssueTrackingPage/IssueTrackingPage';
import IssueDetailPage from './pages/IssueDetailPage/IssueDetailPage';
import LiveMapPage from './pages/LiveMapPage/LiveMapPage';
import AdminDashboardPage from './pages/AdminDashboardPage/AdminDashboardPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage/SuperAdminDashboardPage';
import StaffDashboardPage from './pages/StaffDashboardPage/StaffDashboardPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [isFrameMode, setIsFrameMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quickfix_frame_mode');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [frameScale, setFrameScale] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleScreenSize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleScreenSize);
    return () => window.removeEventListener('resize', handleScreenSize);
  }, []);

  const handleToggleFrameMode = (val) => {
    setIsFrameMode(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickfix_frame_mode', String(val));
    }
  };

  const activeFrameMode = !isMobileScreen && isFrameMode;

  useEffect(() => {
    if (!activeFrameMode || !containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const availableHeight = rect.height;
      const availableWidth = rect.width;

      if (availableHeight > 0 && availableWidth > 0) {
        // Base phone frame size: 400px width x 844px height (+ 16px borders = 416 x 860)
        const baseHeight = 860;
        const baseWidth = 416;

        // Leave at least 16px safety margins
        const scaleY = (availableHeight - 16) / baseHeight;
        const scaleX = (availableWidth - 16) / baseWidth;
        const targetScale = Math.min(1, Math.max(0.35, Math.min(scaleY, scaleX)));
        setFrameScale(Number(targetScale.toFixed(3)));
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [activeFrameMode]);

  return (
    <div className={`app-outer-wrapper ${activeFrameMode ? 'frame-mode-active' : 'fullscreen-mode'}`}>
      {!isMobileScreen && (
        <DeviceFrameToggle
          isFrameMode={activeFrameMode}
          onToggle={handleToggleFrameMode}
          scale={frameScale}
        />
      )}

      {activeFrameMode ? (
        <div className="phone-frame-container" ref={containerRef}>
          <div
            className="phone-frame-scaler"
            style={{
              transform: `scale(${frameScale})`,
              transformOrigin: 'center center',
            }}
          >
            <div className="device-viewport device-frame">
              <div className="phone-notch-bar">
                <span className="phone-time">09:41</span>
                <div className="phone-camera-lens" />
                <div className="phone-status-icons">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

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
                  <Route path="/superadmin" element={<SuperAdminDashboardPage />} />
                  <Route path="/admin" element={user?.role === 'superadmin' ? <SuperAdminDashboardPage /> : <AdminDashboardPage />} />
                  <Route path="/staff" element={<StaffDashboardPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <BottomNav />

              <div className="phone-home-indicator" />
            </div>
          </div>
        </div>
      ) : (
        <div className="device-viewport">
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
              <Route path="/superadmin" element={<SuperAdminDashboardPage />} />
              <Route path="/admin" element={user?.role === 'superadmin' ? <SuperAdminDashboardPage /> : <AdminDashboardPage />} />
              <Route path="/staff" element={<StaffDashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <BottomNav />
        </div>
      )}
    </div>
  );
}

export default App;
