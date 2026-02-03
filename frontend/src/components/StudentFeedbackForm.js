import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './FeedbackForm.css';

const StudentFeedbackForm = ({ user }) => {
  const [formData, setFormData] = useState({
    class_name: '',
    student_id: '',
    feedback_type: 'campus',
    instructor_id: '',
    feedback_text: ''
  });
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await api.get('/api/faculty');
        if (res.data.success) setFacultyList(res.data.faculty || []);
      } catch (err) {
        console.error('Error fetching faculty:', err);
      }
    };
    fetchFaculty();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      ...formData,
      course_id: 'general',
      student_id: formData.student_id || user?.student_id || 'anonymous',
      instructor_id: formData.feedback_type === 'faculty' ? formData.instructor_id : ''
    };

    try {
      const response = await api.post('/api/feedback', payload);
      setResult(response.data);
      setFormData({
        class_name: '',
        student_id: '',
        feedback_type: 'campus',
        instructor_id: '',
        feedback_text: ''
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
      let errorMessage = 'Failed to submit feedback';
      if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'Unable to connect to the server. Please make sure the backend server is running on http://localhost:5000';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-form-container" style={{ 
      padding: '20px 15px', 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start',
      boxSizing: 'border-box'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '600px', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <h2>Submit Your Feedback</h2>

        {error && (
          <div className="alert alert-error" style={{ wordBreak: 'break-word', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="class_name">Class / Section *</label>
            <input
              type="text"
              id="class_name"
              name="class_name"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={formData.class_name}
              onChange={handleChange}
              placeholder="e.g., DSE-A, BTech-CSE-3A"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="student_id">Student ID</label>
            <input
              type="text"
              id="student_id"
              name="student_id"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={formData.student_id || user?.student_id || ''}
              onChange={handleChange}
              placeholder={user?.student_id ? user.student_id : 'Enter your student ID (optional)'}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Feedback Type *</label>
            <div className="form-mode-toggle" style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px' 
            }}>
              <button
                type="button"
                className={`toggle-btn ${formData.feedback_type === 'campus' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, feedback_type: 'campus', instructor_id: '' })}
                style={{ flex: '1 1 140px', padding: '10px' }}
              >
                🏫 Campus
              </button>
              <button
                type="button"
                className={`toggle-btn ${formData.feedback_type === 'faculty' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, feedback_type: 'faculty' })}
                style={{ flex: '1 1 140px', padding: '10px' }}
              >
                👨‍🏫 Faculty
              </button>
            </div>
            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block', lineHeight: '1.4' }}>
              Campus: for general college feedback (seen by admin only). Faculty: for a specific teacher (seen by that faculty & admin).
            </small>
          </div>

          {formData.feedback_type === 'faculty' && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="instructor_id">Select Faculty *</label>
              <select
                id="instructor_id"
                name="instructor_id"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formData.instructor_id}
                onChange={handleChange}
                required={formData.feedback_type === 'faculty'}
              >
                <option value="">-- Choose Faculty --</option>
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || f.username} {f.faculty_id ? `(${f.faculty_id})` : ''}
                  </option>
                ))}
              </select>
              {facultyList.length === 0 && (
                <small style={{ color: '#dc3545' }}>No faculty available. Ask admin to add faculty.</small>
              )}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="feedback_text">Feedback Text *</label>
            <textarea
              id="feedback_text"
              name="feedback_text"
              style={{ width: '100%', boxSizing: 'border-box', minHeight: '120px' }}
              value={formData.feedback_text}
              onChange={handleChange}
              placeholder="Enter your feedback here. Be specific about your experience..."
              required
              rows="6"
            />
            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
              Share your honest thoughts. Your feedback helps us improve.
            </small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      {result && (
        <div className="success-popup-overlay" style={{ padding: '20px' }} onClick={() => setResult(null)}>
          <div className="success-popup" style={{ width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="success-popup-icon">✓</div>
            <h3>Success!</h3>
            <p>Your feedback has been submitted successfully. Thank you for your input!</p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setResult(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeedbackForm;