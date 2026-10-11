import { createContext, useContext, useEffect, useState } from 'react';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

function readStoredAuth() {
  const token = localStorage.getItem('mp_token');
  const role = localStorage.getItem('mp_role');
  if (!token || !role) return null;
  return { token, role };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, []);

  function login(token, role) {
    localStorage.setItem('mp_token', token);
    localStorage.setItem('mp_role', role);
    setAuth({ token, role });
  }

  function logout() {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_role');
    setAuth(null);
  }

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
