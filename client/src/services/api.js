import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smart-campus-quickfix-server.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quickfix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session unauthorized or expired');
    }
    return Promise.reject(error);
  }
);

// Modular API helper services
export const issueAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (formData) => api.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  upvote: (id) => api.post(`/issues/${id}/upvote`),
  updateStatus: (id, formData) => api.patch(`/issues/${id}/status`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addComment: (id, text) => api.post(`/issues/${id}/comment`, { text }),
  checkDuplicates: (params) => api.get('/issues/check-duplicate', { params }),
  getStats: () => api.get('/issues/stats/overview'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  assignTechnician: (issueId, staffId) => api.patch(`/admin/issues/${issueId}/assign`, { staffId }),
  deleteIssue: (issueId) => api.delete(`/admin/issues/${issueId}`),
};

export const locationAPI = {
  getActiveStaff: () => api.get('/location/active-staff'),
  logLocation: (data) => api.post('/location/log', data),
  getRecentLogs: () => api.get('/location/recent'),
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
};

export default api;
