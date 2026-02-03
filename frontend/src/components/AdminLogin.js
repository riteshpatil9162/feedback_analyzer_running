import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Login.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/auth/login', formData);
      if (response.data.success && response.data.user.role === 'admin') {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid credentials or not an admin account');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="login-card" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <h1>Admin Login</h1>
        <p className="login-subtitle">Access the admin dashboard</p>

        {error && (
          <div className="alert alert-error" style={{ wordBreak: 'break-word', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter admin username"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter admin password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading} 
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer" style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
            Student? <a href="/student/login">Student Login</a> | Faculty? <a href="/faculty/login">Faculty Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;