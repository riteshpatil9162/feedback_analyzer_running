import React, { useState } from 'react';
import api from '../utils/api';
import './FeedbackForm.css';

const AdminFeedbackUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);

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
        maxWidth: '650px', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Upload Feedback File</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.4', fontSize: '0.95rem' }}>
          Upload a CSV or Excel file containing multiple feedback entries to process them in bulk.
        </p>
        
        {error && (
          <div className="alert alert-error" style={{ wordBreak: 'break-word', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {uploadResult && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginTop: 0 }}>File Uploaded Successfully!</h3>
            <div className="result-details" style={{ fontSize: '0.9rem' }}>
              <p><strong>Total Rows:</strong> {uploadResult.total_rows}</p>
              <p><strong>Processed:</strong> {uploadResult.processed}</p>
              {uploadResult.failed > 0 && (
                <p><strong>Failed:</strong> {uploadResult.failed}</p>
              )}
              <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{uploadResult.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleFileUpload}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="file_upload" style={{ display: 'block', marginBottom: '0.5rem' }}>Upload CSV or Excel File</label>
            <input
              type="file"
              id="file_upload"
              name="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px dashed #ccc', 
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              required
            />
            <small style={{ color: '#666', marginTop: '0.8rem', display: 'block', lineHeight: '1.5' }}>
              Supported formats: <strong>CSV, XLSX, XLS</strong>
              <br />
              Required column: <strong>feedback_text</strong>
              <br />
              Optional columns: student_id, course_id, instructor_id.
            </small>
            
            {selectedFile && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '10px', 
                background: '#e7f3ff', 
                borderRadius: '5px',
                fontSize: '0.85rem',
                border: '1px solid #b3d7ff',
                wordBreak: 'break-all'
              }}>
                Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={uploadLoading || !selectedFile}
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '1rem',
              cursor: uploadLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploadLoading ? 'Uploading...' : 'Upload and Process File'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminFeedbackUpload;