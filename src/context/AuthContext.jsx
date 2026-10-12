import { createContext, useContext, useEffect, useState } from 'react';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

// Dashboard-link sessions carry readOnly in the JWT; the server enforces
// it, this only drives what the UI offers.
function isReadOnlyToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Boolean(payload.readOnly);
  } catch {
    return false;
  }
}

function readStoredAuth() {
  const token = localStorage.getItem('mp_token');
  const role = localStorage.getItem('mp_role');
  if (!token || !role) return null;
  return { token, role, readOnly: isReadOnlyToken(token) };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, []);

  function login(token, role) {
    localStorage.setItem('mp_token', token);
    localStorage.setItem('mp_role', role);
    setAuth({ token, role, readOnly: isReadOnlyToken(token) });
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
