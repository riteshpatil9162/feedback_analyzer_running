import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    instructor_id: '',
    course_id: ''
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const params = {};
      if (filters.instructor_id) params.instructor_id = filters.instructor_id;
      if (filters.course_id) params.course_id = filters.course_id;

      const response = await api.get('/api/feedback/analytics', { params });
      setAnalytics(response.data.analytics);
      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchAnalytics();
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const { sentiment_distribution, category_distribution } = analytics;

  // Prepare data for charts
  const sentimentData = Object.entries(sentiment_distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const categoryData = Object.entries(category_distribution).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  const COLORS = ['#28a745', '#ffc107', '#dc3545', '#667eea', '#764ba2'];

  return (
    <div className="analytics-container">
      <h1>Analytics Dashboard</h1>

      <div className="card">
        <h2>Filters</h2>
        <form onSubmit={handleFilterSubmit} className="filter-form">
          <div className="form-group">
            <label htmlFor="instructor_id">Instructor ID</label>
            <input
              type="text"
              id="instructor_id"
              name="instructor_id"
              value={filters.instructor_id}
              onChange={handleFilterChange}
              placeholder="Filter by instructor"
            />
          </div>

          <div className="form-group">
            <label htmlFor="course_id">Course ID</label>
            <input
              type="text"
              id="course_id"
              name="course_id"
              value={filters.course_id}
              onChange={handleFilterChange}
              placeholder="Filter by course"
            />
          </div>

          <button type="submit" className="btn btn-primary">Apply Filters</button>
        </form>
      </div>

      <div className="analytics-grid">
        <div className="card chart-card">
          <h2>Sentiment Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h2>Category Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Summary Statistics</h2>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Feedbacks:</span>
            <span className="stat-value">{analytics.total_feedbacks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Urgent Alerts:</span>
            <span className="stat-value" style={{ color: analytics.urgent_count > 0 ? '#dc3545' : '#667eea' }}>
              {analytics.urgent_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

