import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  student: {
    id: 'usr-student-1',
    name: 'Alex Chen (Student)',
    email: 'student@serp.cloud',
    role: 'student'
  },
  organizer: {
    id: 'usr-organizer-1',
    name: 'Prof. Sarah Connor (Organizer)',
    email: 'organizer@serp.cloud',
    role: 'organizer'
  }
};

export function AuthProvider({ children }) {
  const initialRole = localStorage.getItem('serp_role') || 'student';
  const [user, setUser] = useState(DEMO_USERS[initialRole] || DEMO_USERS.student);
  const [role, setRole] = useState(initialRole);
  const [token, setToken] = useState(localStorage.getItem('serp_token') || 'demo-jwt-token');
  const [loading, setLoading] = useState(false);

  // Initialize or restore session from backend if online
  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('serp_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          if (res?.user) {
            setUser(res.user);
            setRole(res.user.role);
          }
        } catch (e) {
          // Keep demo user active
        }
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      localStorage.setItem('serp_token', res.token);
      localStorage.setItem('serp_role', res.user.role);
      setToken(res.token);
      setUser(res.user);
      setRole(res.user.role);
      return res.user;
    } catch (err) {
      // Local fallback login for presentation
      const fallbackUser = email.includes('organizer') ? DEMO_USERS.organizer : DEMO_USERS.student;
      localStorage.setItem('serp_role', fallbackUser.role);
      setUser(fallbackUser);
      setRole(fallbackUser.role);
      return fallbackUser;
    }
  };

  const register = async (name, email, password, targetRole) => {
    try {
      const res = await api.register(name, email, password, targetRole);
      localStorage.setItem('serp_token', res.token);
      localStorage.setItem('serp_role', res.user.role);
      setToken(res.token);
      setUser(res.user);
      setRole(res.user.role);
      return res.user;
    } catch (err) {
      const newUser = { id: `usr-${Date.now()}`, name, email, role: targetRole || 'student' };
      localStorage.setItem('serp_role', newUser.role);
      setUser(newUser);
      setRole(newUser.role);
      return newUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('serp_token');
    localStorage.removeItem('serp_role');
    setToken(null);
    setUser(null);
    setRole('student');
  };

  const switchDemoRole = async (targetRole) => {
    // 1. Immediately update state & localStorage (guaranteed zero lag, zero network blockage)
    const nextRole = targetRole === 'organizer' ? 'organizer' : 'student';
    const nextUser = DEMO_USERS[nextRole];
    setRole(nextRole);
    setUser(nextUser);
    localStorage.setItem('serp_role', nextRole);

    // 2. Silently attempt backend sync if API is live
    try {
      if (nextRole === 'organizer') {
        const res = await api.login('organizer@serp.cloud', 'organizer123');
        if (res?.token) {
          localStorage.setItem('serp_token', res.token);
          setToken(res.token);
        }
      } else {
        const res = await api.login('student@serp.cloud', 'student123');
        if (res?.token) {
          localStorage.setItem('serp_token', res.token);
          setToken(res.token);
        }
      }
    } catch (e) {
      // Silently stay in instant local mode
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
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
