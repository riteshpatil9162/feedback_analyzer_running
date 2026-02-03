import axios from 'axios';

// The baseURL should point to your live Render backend URL
const api = axios.create({
  baseURL: 'https://feedback-analyzer-running-1.onrender.com', 
  timeout: 30000, // Increased timeout for AI processing on cold starts
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Helpful for debugging deployment connection issues
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Production API Error:', error);
    if (error.response) {
      console.error('Status:', error.response.status, 'Data:', error.response.data);
    } else if (error.request) {
      // If Render backend is sleeping (Free Tier), this error might trigger
      console.error('No response from Render backend. Server may be starting up...');
      error.message = 'Backend server is starting up. Please try again in 30 seconds.';
    }
    return Promise.reject(error);
  }
);

export default api;