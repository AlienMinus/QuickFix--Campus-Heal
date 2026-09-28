import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import locationLogger from '../services/locationLogger';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('quickfix_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.user) {
            setUser(res.data.user);
          }
        } catch (error) {
          console.warn('Session check warning:', error.message);
          const savedUser = localStorage.getItem('quickfix_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } else {
        const defaultStudent = {
          id: 'demo-student-1',
          name: 'Rohan Sharma (Student)',
          email: 'student.demo@gift.ac.in',
          role: 'student',
          department: 'Computer Science & Engineering',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
        };
        setUser(defaultStudent);
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
      saveAuthSession(res.data.token, res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      saveAuthSession(res.data.token, res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const demoLogin = async (role) => {
    try {
      const res = await api.post('/auth/demo-login', { role });
      saveAuthSession(res.data.token, res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      const demoRoles = {
        student: {
          id: 'demo-student-1',
          name: 'Rohan Sharma (Student)',
          email: 'student.demo@gift.ac.in',
          role: 'student',
          department: 'Computer Science & Engineering',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
        },
        staff: {
          id: 'demo-staff-1',
          name: 'Bikash Mohapatra (Staff)',
          email: 'maintenance.staff@gift.ac.in',
          role: 'staff',
          department: 'Campus Electrical & Facilities Maintenance',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        },
        admin: {
          id: 'demo-admin-1',
          name: 'Prof. S. K. Patnaik (Admin)',
          email: 'admin.campus@gift.ac.in',
          role: 'admin',
          department: 'BPUT / GIFT Central Administration',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        },
      };
      const chosen = demoRoles[role] || demoRoles.student;
      saveAuthSession('demo-7day-jwt-token-active', chosen);
      return { success: true, user: chosen };
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
        demoLogin,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
        isStudent: user?.role === 'student' || !user?.role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
