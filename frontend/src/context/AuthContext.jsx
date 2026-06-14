/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Validate token and fetch user info on load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/me');
          if (typeof response.data === 'string' && response.data.toLowerCase().includes('<html')) {
            throw new Error('API returned HTML instead of JSON.');
          }
          setUser(response.data);
        } catch (error) {
          console.error('Session validation failed:', error);
          // Token is invalid/expired, clean it up
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Prevent crash if Vercel returns 500 HTML error page or 404 index.html
      if (typeof response.data === 'string' && response.data.toLowerCase().includes('<html')) {
        throw new Error('API returned HTML instead of JSON. The backend might be offline or misconfigured on Vercel.');
      }

      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login request failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Authentication failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
