import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('serp_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize or restore session
  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('serp_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('serp_token');
        }
      }

      // Default: login as student demo user seamlessly
      try {
        const loginRes = await api.login('student@serp.cloud', 'student123');
        localStorage.setItem('serp_token', loginRes.token);
        setToken(loginRes.token);
        setUser(loginRes.user);
      } catch (e) {
        console.error('Failed default demo login:', e);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('serp_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (name, email, password, role) => {
    const res = await api.register(name, email, password, role);
    localStorage.setItem('serp_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('serp_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (targetRole) => {
    try {
      if (targetRole === 'organizer') {
        await login('organizer@serp.cloud', 'organizer123');
      } else {
        await login('student@serp.cloud', 'student123');
      }
    } catch (err) {
      console.error('Error switching demo role:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'student',
        loading,
        login,
        register,
        logout,
        switchDemoRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
