import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './FacultyDashboard.css';

const COLORS = ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];
const SENTIMENT_COLORS = { positive: '#28a745', neutral: '#ffc107', negative: '#dc3545' };

const FacultyDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [classFilter, setClassFilter] = useState('');
  const [allClasses, setAllClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('feedback');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      if (!isAuthenticated || !storedUser) {
        navigate('/faculty/login');
        return;
      }
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'faculty') {
        navigate('/faculty/login');
        return;
      }
      try {
        const response = await api.get('/api/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          setLoading(false);
        } else {
          navigate('/faculty/login');
        }
      } catch (err) {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        navigate('/faculty/login');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
      fetchAnalytics();
    }
  }, [user, classFilter]);

  const fetchFeedbacks = async () => {
    try {
      const params = classFilter ? { class_name: classFilter } : {};
      const response = await api.get('/api/feedback', { params });
      const list = response.data.feedbacks || [];
      setFeedbacks(list);
      const classes = [...new Set(list.map(f => f.class_name).filter(Boolean))];
      setAllClasses(prev => [...new Set([...prev, ...classes])].sort());
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setFeedbacks([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = classFilter ? { class_name: classFilter } : {};
      const response = await api.get('/api/feedback/analytics', { params });
      setAnalytics(response.data.analytics || {});
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      navigate('/faculty/login');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading faculty-loading">Loading...</div>;
  }

  const sentimentDist = analytics?.sentiment_distribution || {};
  const categoryDist = analytics?.category_distribution || {};

  const sentimentChartData = [
    { name: 'Positive', value: sentimentDist.positive || 0, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: sentimentDist.neutral || 0, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: sentimentDist.negative || 0, color: SENTIMENT_COLORS.negative }
  ].filter(d => d.value > 0);

  const categoryChartData = Object.entries(categoryDist).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: value,
    fill: COLORS[Object.keys(categoryDist).indexOf(name) % COLORS.length]
  }));

  const totalFeedbacks = analytics?.total_feedbacks || 0;

  return (
    <div className="faculty-dashboard">
      <nav className="faculty-navbar">
        <div className="nav-container">
          <h1 className="nav-logo">👨‍🏫 Faculty Feedback Portal</h1>
          <div className="nav-user">
            <span>Welcome, {user?.name || user?.username}</span>
            <button onClick={handleLogout} className="btn btn-logout">Logout</button>
          </div>
        </div>
      </nav>

      <main className="faculty-main">
        <div className="filter-section">
          <label>Filter by Class:</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="class-filter-select"
          >
            <option value="">All Classes</option>
            {allClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="faculty-tabs">
          <button
            className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            📝 Feedback List
          </button>
          <button
            className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => setActiveTab('charts')}
          >
            📊 Charts & Analytics
          </button>
        </div>

        {activeTab === 'feedback' && (
          <div className="faculty-feedback-list">
            <h2>Analyzed Feedback</h2>
            {feedbacks.length === 0 ? (
              <div className="empty-state">
                <p>No feedback for you yet. Students can submit faculty feedback from the student portal.</p>
              </div>
            ) : (
              feedbacks.map((fb, idx) => (
                <div key={fb.id} className={`feedback-card ${fb.sentiment}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="feedback-card-header">
                    <span className={`sentiment-badge ${fb.sentiment}`}>{fb.sentiment}</span>
                    {fb.class_name && <span className="class-badge">{fb.class_name}</span>}
                    <span className="feedback-date">{formatDate(fb.timestamp)}</span>
                  </div>
                  <div className="feedback-text">{fb.feedback_text}</div>
                  <div className="feedback-analysis">
                    <div className="analysis-row">
                      <strong>Category:</strong> {fb.category || 'general'}
                    </div>
                    <div className="analysis-row">
                      <strong>Sentiment Score:</strong> {(fb.sentiment_score || 0).toFixed(2)}
                    </div>
                    {fb.suggestions && (
                      <div className="improvements-section">
                        <strong>💡 Improvements / Suggestions:</strong>
                        <p>{fb.suggestions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="faculty-charts-section">
            <div className="stats-row animated">
              <div className="stat-box">
                <span className="stat-num">{totalFeedbacks}</span>
                <span className="stat-label">Total Feedbacks</span>
              </div>
              <div className="stat-box positive">
                <span className="stat-num">{sentimentDist.positive || 0}</span>
                <span className="stat-label">Positive</span>
              </div>
              <div className="stat-box negative">
                <span className="stat-num">{sentimentDist.negative || 0}</span>
                <span className="stat-label">Negative</span>
              </div>
              <div className="stat-box neutral">
                <span className="stat-num">{sentimentDist.neutral || 0}</span>
                <span className="stat-label">Neutral</span>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Sentiment Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  {sentimentChartData.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {sentimentChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} feedbacks`, 'Count']} />
                    </PieChart>
                  ) : (
                    <div className="chart-empty">No data yet</div>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Feedback by Category</h3>
                <ResponsiveContainer width="100%" height={280}>
                  {categoryChartData.length > 0 ? (
                    <BarChart data={categoryChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                        {categoryChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <div className="chart-empty">No data yet</div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyDashboard;
