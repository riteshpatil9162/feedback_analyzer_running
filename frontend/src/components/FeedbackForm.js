import React, { useState } from 'react';
import api from '../utils/api';
import './FeedbackForm.css';

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    instructor_id: '',
    feedback_text: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/api/feedback', formData);
      setResult(response.data);
      setFormData({
        student_id: '',
        course_id: '',
        instructor_id: '',
        feedback_text: ''
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
      let errorMessage = 'Failed to submit feedback';
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'Unable to connect to the server. Please make sure the backend server is running on http://localhost:5000';
      } else {
        // Other error
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
        setSelectedFile(null);
      }
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploadLoading(true);
    setError(null);
    setUploadResult(null);

    const uploadFormData = new FormData();
    uploadFormData.append('file', selectedFile);

    try {
      const response = await api.post('/api/feedback/upload', uploadFormData, {
        timeout: 60000, // 60 seconds timeout for file uploads
      });
      setUploadResult(response.data);
      setSelectedFile(null);
      // Reset file input
      e.target.reset();
    } catch (err) {
      console.error('Error uploading file:', err);
      let errorMessage = 'Failed to upload file';
      
      if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'Unable to connect to the server. Please make sure the backend server is running on http://localhost:5000';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="feedback-form-container">
      <div className="card">
        <h2>Submit Student Feedback</h2>
        
        <div className="form-mode-toggle">
          <button
            type="button"
            className={`toggle-btn ${!uploadMode ? 'active' : ''}`}
            onClick={() => {
              setUploadMode(false);
              setError(null);
              setResult(null);
              setUploadResult(null);
            }}
          >
            Manual Entry
          </button>
          <button
            type="button"
            className={`toggle-btn ${uploadMode ? 'active' : ''}`}
            onClick={() => {
              setUploadMode(true);
              setError(null);
              setResult(null);
              setUploadResult(null);
            }}
          >
            Upload File (CSV/Excel)
          </button>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {!uploadMode ? (
          <>
            {result && (
              <div className="alert alert-success">
                <h3>Feedback Submitted Successfully!</h3>
                <div className="result-details">
                  <p><strong>Category:</strong> <span className="badge badge-category">{result.feedback.category}</span></p>
                  <p><strong>Sentiment:</strong> 
                    <span className={`badge badge-${result.feedback.sentiment}`}>
                      {result.feedback.sentiment}
                    </span>
                    <span style={{ marginLeft: '1rem' }}>
                      Score: {result.feedback.sentiment_score}
                    </span>
                  </p>
                  {result.feedback.is_urgent && (
                    <p><strong>Status:</strong> <span className="badge badge-urgent">Urgent Alert Sent</span></p>
                  )}
                  {result.feedback.suggestions && (
                    <div style={{ marginTop: '1rem' }}>
                      <strong>Suggestions:</strong>
                      <p style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '5px' }}>
                        {result.feedback.suggestions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="student_id">Student ID (Optional)</label>
                <input
                  type="text"
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  placeholder="Enter student ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="course_id">Course ID (Optional)</label>
                <input
                  type="text"
                  id="course_id"
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  placeholder="Enter course ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="instructor_id">Instructor ID (Optional)</label>
                <input
                  type="text"
                  id="instructor_id"
                  name="instructor_id"
                  value={formData.instructor_id}
                  onChange={handleChange}
                  placeholder="Enter instructor ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="feedback_text">Feedback Text *</label>
                <textarea
                  id="feedback_text"
                  name="feedback_text"
                  value={formData.feedback_text}
                  onChange={handleChange}
                  placeholder="Enter your feedback here. Be specific about your experience..."
                  required
                />
                <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                  Your feedback will be analyzed for sentiment, categorized, and suggestions will be generated.
                </small>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </>
        ) : (
          <>
            {uploadResult && (
              <div className="alert alert-success">
                <h3>File Uploaded Successfully!</h3>
                <div className="result-details">
                  <p><strong>Total Rows:</strong> {uploadResult.total_rows}</p>
                  <p><strong>Processed:</strong> {uploadResult.processed}</p>
                  {uploadResult.failed > 0 && (
                    <p><strong>Failed:</strong> {uploadResult.failed}</p>
                  )}
                  <p style={{ marginTop: '1rem' }}>{uploadResult.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleFileUpload}>
              <div className="form-group">
                <label htmlFor="file_upload">Upload CSV or Excel File</label>
                <input
                  type="file"
                  id="file_upload"
                  name="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  required
                />
                <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                  Supported formats: CSV (.csv), Excel (.xlsx, .xls)
                  <br />
                  File should contain columns: feedback_text (required), student_id, course_id, instructor_id (all optional)
                  <br />
                  Column names are case-insensitive and can be variations like: feedback, text, comment, student, course, instructor, etc.
                </small>
                {selectedFile && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#e7f3ff', borderRadius: '5px' }}>
                    Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={uploadLoading || !selectedFile}>
                {uploadLoading ? 'Uploading...' : 'Upload and Process File'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;

