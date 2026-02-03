import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      
      console.log('AuthContext: Checking auth, tokenFromUrl:', !!tokenFromUrl);
      
      // Clear any corrupted localStorage data
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          JSON.parse(savedUser);
        }
      } catch (e) {
        console.warn('AuthContext: Clearing corrupted localStorage');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      
      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
        console.log('AuthContext: Saved token from URL');
        
        try {
          const response = await authAPI.getMe();
          console.log('AuthContext: getMe response:', response.data);
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            console.log('AuthContext: User set:', response.data.user);
          } else {
            console.log('AuthContext: getMe returned success:false');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('AuthContext: Auth check failed:', error.response?.data || error.message);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        const token = localStorage.getItem('token');
        console.log('AuthContext: Checking localStorage token:', !!token);
        
        if (token) {
          try {
            const response = await authAPI.getMe();
            console.log('AuthContext: getMe response:', response.data);
            if (response.data.success) {
              setUser(response.data.user);
              localStorage.setItem('user', JSON.stringify(response.data.user));
              console.log('AuthContext: User set:', response.data.user);
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (error) {
            console.error('AuthContext: Auth check failed:', error.response?.data || error.message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
