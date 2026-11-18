import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('cs_token');
    if (token && !user) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('cs_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('cs_token');
          localStorage.removeItem('cs_user');
        });
    }
  }, [user]);

  const loginCustomer = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: String(email || '').trim(),
        password: String(password || '').trim(),
      });
      if (res.data.user?.role === 'admin') {
        localStorage.setItem('cs_admin_token', res.data.token);
        localStorage.setItem('cs_admin_user', JSON.stringify(res.data.user));
        setAdminUser(res.data.user);
      }
      localStorage.setItem('cs_token', res.data.token);
      localStorage.setItem('cs_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const registerCustomer = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      localStorage.setItem('cs_token', res.data.token);
      localStorage.setItem('cs_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', { email, password });
      localStorage.setItem('cs_admin_token', res.data.token);
      localStorage.setItem('cs_admin_user', JSON.stringify(res.data.user));
      setAdminUser(res.data.user);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logoutCustomer = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    setUser(null);
  };

  const logoutAdmin = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('cs_admin_token');
    localStorage.removeItem('cs_admin_user');
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    setAdminUser(null);
    setUser(null);
  };

  const updateCustomerState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('cs_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        loading,
        loginCustomer,
        registerCustomer,
        loginAdmin,
        logoutCustomer,
        logoutAdmin,
        updateCustomerState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
