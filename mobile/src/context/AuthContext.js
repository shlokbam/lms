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
        // Optionally fetch profile to verify token
        const res = await api.get('/api/trainee/dashboard').catch(() => null);
        if (res) {
          // Typically the dashboard would return user info or we fetch it from /profile
          const profile = await api.get('/api/trainee/profile').catch(() => null);
          if (profile) setUser(profile.data.user);
        } else {
          await SecureStore.deleteItemAsync('token');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { access_token } = res.data;
    await SecureStore.setItemAsync('token', access_token);
    // Fetch profile after login
    const profile = await api.get('/api/trainee/profile');
    setUser(profile.data.user);
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
