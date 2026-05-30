import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'dasig_token';
const USER_KEY  = 'dasig_user';

function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  // Initialise from cache so the UI never flashes "logged out" on refresh
  const [user, setUser]       = useState(getCachedUser);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  function applyUser(u) {
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
    setUser(u);
  }

  // Validate token in background on mount; don't clear until we get a 401
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    fetch('http://localhost:4000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          // Token genuinely invalid — clear everything
          applyUser(null);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then(u => { if (u) applyUser(u); })
      .catch(() => {
        // Network error / backend down — keep cached user, don't force logout
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.auth.login(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem('dasig_welcome', data.user.name || 'back');
    applyUser(data.user);
    return data.user;
  }

  async function register(body) {
    const data = await api.auth.register(body);
    localStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem('dasig_welcome', data.user.name || 'back');
    applyUser(data.user);
    return data.user;
  }

  async function refreshUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const u = await api.auth.me();
      applyUser(u);
    } catch (_) {}
  }

  function logout() {
    applyUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
