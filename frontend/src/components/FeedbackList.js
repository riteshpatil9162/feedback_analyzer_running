import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './FeedbackList.css';

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    instructor_id: '',
    course_id: '',
    class_name: '',
    feedback_type: ''
  });

  useEffect(() => {
    fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFeedbacks = async (filtersToUse = null) => {
    try {
      setLoading(true);
      const params = {};
      const activeFilters = filtersToUse !== null ? filtersToUse : filters;
      
      if (activeFilters.instructor_id) params.instructor_id = activeFilters.instructor_id;
      if (activeFilters.course_id) params.course_id = activeFilters.course_id;
      if (activeFilters.class_name) params.class_name = activeFilters.class_name;
      if (activeFilters.feedback_type) params.feedback_type = activeFilters.feedback_type;

      const response = await api.get('/api/feedback', { params });
      setFeedbacks(response.data.feedbacks);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load feedbacks');
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
    fetchFeedbacks();
  };

  const handleDelete = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return;
    }

    setDeletingId(feedbackId);
    try {
      await api.delete(`/api/feedback/${feedbackId}`);
      setSuccessMessage('Feedback deleted successfully!');
      // Refresh the feedback list
      await fetchFeedbacks();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete feedback');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading feedbacks...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="feedback-list-container">
      <div className="feedback-list-header">
        <h1>📝 Student Feedbacks</h1>
        <div className="feedbacks-count-badge">
          <span className="count-number">{feedbacks.length}</span>
          <span className="count-label">Total Feedbacks</span>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card filter-card">
        <h2>🔍 Filters</h2>
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

          <div className="form-group">
            <label htmlFor="class_name">Class</label>
            <input
              type="text"
              id="class_name"
              name="class_name"
              value={filters.class_name}
              onChange={handleFilterChange}
              placeholder="Filter by class"
            />
          </div>

          <div className="form-group">
            <label htmlFor="feedback_type">Feedback Type</label>
            <select
              id="feedback_type"
              name="feedback_type"
              value={filters.feedback_type}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="campus">Campus</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">Apply Filters</button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => {
              const emptyFilters = { instructor_id: '', course_id: '', class_name: '', feedback_type: '' };
              setFilters(emptyFilters);
              fetchFeedbacks(emptyFilters);
            }}
          >
            Clear Filters
          </button>
        </form>
      </div>

      <div className="feedbacks-list">
        {feedbacks.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📭</div>
            <p>No feedbacks found. Submit your first feedback!</p>
          </div>
        ) : (
          feedbacks.map((feedback, index) => (
            <div
              key={feedback.id}
              className={`feedback-item ${feedback.is_urgent ? 'urgent' : ''}`}
            >
              <div className="feedback-header">
                <div className="feedback-number-section">
                  <span className="feedback-number">#{index + 1}</span>
                  {feedback.is_urgent && (
                    <span className="badge badge-urgent">🚨 Urgent</span>
                  )}
                </div>
                <div className="feedback-actions">
                  <div className="feedback-date">{formatDate(feedback.timestamp)}</div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(feedback.id)}
                    disabled={deletingId === feedback.id}
                    title="Delete feedback"
                  >
                    {deletingId === feedback.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>

              <div className="feedback-text">{feedback.feedback_text}</div>

              <div className="feedback-meta">
                <span className={`badge badge-${feedback.sentiment}`}>
                  {feedback.sentiment}
                </span>
                <span className="badge badge-category">
                  {feedback.category}
                </span>
                {feedback.feedback_type && (
                  <span className="badge badge-type">
                    {feedback.feedback_type}
                  </span>
                )}
                {feedback.class_name && (
                  <span className="meta-item">📋 Class: {feedback.class_name}</span>
                )}
                {feedback.student_id && (
                  <span className="meta-item">👤 Student: {feedback.student_id}</span>
                )}
                {feedback.course_id && (
                  <span className="meta-item">📚 Course: {feedback.course_id}</span>
                )}
                {feedback.instructor_id && (
                  <span className="meta-item">👨‍🏫 Instructor: {feedback.instructor_id}</span>
                )}
                {feedback.sentiment_score !== null && feedback.sentiment_score !== undefined && (
                  <span className="meta-item">⭐ Score: {feedback.sentiment_score.toFixed(2)}</span>
                )}
              </div>

              {feedback.suggestions && (
                <div className="feedback-suggestions">
                  <strong>💡 Suggestions:</strong>
                  <p>{feedback.suggestions}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackList;

