import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const TOKEN_KEY = 'dasig_token';
const USER_KEY  = 'dasig_user';

const AuthContext = createContext(null);

function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
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

  // Validate token via the api module (no hardcoded URL — works in production)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    api.auth.me()
      .then(u => { if (u) applyUser(u); })
      .catch(err => {
        // 401/403 = invalid token → clear session
        if (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('unauthorized'))) {
          applyUser(null);
        }
        // Network error → keep cached user, don't force logout
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
