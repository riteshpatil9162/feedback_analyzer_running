import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Dashboard from './Dashboard';
import FeedbackList from './FeedbackList';
import UrgentAlerts from './UrgentAlerts';
import Analytics from './Analytics';
import AdminFeedbackUpload from './AdminFeedbackUpload';
import AdminFacultyManagement from './AdminFacultyManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (!isAuthenticated || !storedUser) {
        navigate('/admin/login');
        return;
      }

      const userData = JSON.parse(storedUser);
      if (userData.role !== 'admin') {
        navigate('/admin/login');
        return;
      }

      // Verify session with backend
      try {
        const response = await api.get('/api/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          setLoading(false);
        } else {
          navigate('/admin/login');
        }
      } catch (err) {
        // Session expired or invalid
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        navigate('/admin/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      navigate('/admin/login');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-navbar">
        <div className="nav-container">
          <h1 className="nav-logo">📊 Admin Dashboard</h1>
          <div className="nav-user">
            <span>Welcome, {user?.username}</span>
            <button onClick={handleLogout} className="btn btn-logout">Logout</button>
          </div>
        </div>
      </nav>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === 'feedbacks' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedbacks')}
            >
              📝 View Feedbacks
            </button>
            <button
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📈 Analytics
            </button>
            <button
              className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              🚨 Urgent Alerts
            </button>
            <button
              className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              📤 Upload Feedback
            </button>
            <button
              className={`nav-item ${activeTab === 'faculty' ? 'active' : ''}`}
              onClick={() => setActiveTab('faculty')}
            >
              👨‍🏫 Manage Faculty
            </button>
          </nav>
        </aside>

        <main className="admin-main">
          {activeTab === 'dashboard' && <Dashboard onViewAlerts={() => setActiveTab('alerts')} />}
          {activeTab === 'feedbacks' && <FeedbackList />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'alerts' && <UrgentAlerts />}
          {activeTab === 'upload' && <AdminFeedbackUpload />}
          {activeTab === 'faculty' && <AdminFacultyManagement />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

