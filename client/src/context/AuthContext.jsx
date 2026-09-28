import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import locationLogger from '../services/locationLogger';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('quickfix_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('quickfix_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('quickfix_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.warn('Session check warning:', error.message);
          // If 401 or unauthorized, clear token
          if (error.response?.status === 401) {
            localStorage.removeItem('quickfix_token');
            localStorage.removeItem('quickfix_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const saveAuthSession = (authToken, authUser) => {
    localStorage.setItem('quickfix_token', authToken);
    localStorage.setItem('quickfix_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        saveAuthSession(res.data.token, res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: 'Invalid server response.' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data && res.data.token) {
        saveAuthSession(res.data.token, res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. An account with this email may already exist.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('quickfix_token');
    localStorage.removeItem('quickfix_user');
    setToken(null);
    setUser(null);
    locationLogger.stopLogging();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        isSuperAdmin: user?.role === 'superadmin',
        isStaff: user?.role === 'staff',
        isStudent: user?.role === 'student' || (!user?.role && !user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
