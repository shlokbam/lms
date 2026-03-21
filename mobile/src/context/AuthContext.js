import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        // Fetch current user details role-agnostically
        const res = await api.get('/api/auth/me').catch(() => null);
        if (res && res.data) {
          setUser(res.data);
        } else {
          await SecureStore.deleteItemAsync('token');
        }
      }
    } catch (e) {
      console.error("Auth check error:", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('[Auth] Attempting login for:', email);
      const res = await api.post('/api/auth/login', { email, password });
      console.log('[Auth] Login success');
      const { access_token } = res.data;
      await SecureStore.setItemAsync('token', access_token);
      const profile = await api.get('/api/auth/me');
      setUser(profile.data);
    } catch (e) {
      console.error('[Auth] Login error details:', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message,
        url: e.config?.url,
        baseURL: e.config?.baseURL
      });
      throw e;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
