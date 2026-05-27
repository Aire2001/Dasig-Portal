import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dasig_token');
    if (!token) { setLoading(false); return; }
    fetch('http://localhost:4000/api/auth/me', {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('dasig_token');
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then(u => { if (u) setUser(u); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.auth.login(email, password);
    localStorage.setItem('dasig_token', data.token);
    sessionStorage.setItem('dasig_welcome', data.user.name || 'back');
    setUser(data.user);
    return data.user;
  }

  async function register(body) {
    const data = await api.auth.register(body);
    localStorage.setItem('dasig_token', data.token);
    sessionStorage.setItem('dasig_welcome', data.user.name || 'back');
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('dasig_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
