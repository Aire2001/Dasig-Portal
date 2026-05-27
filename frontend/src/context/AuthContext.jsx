import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dasig_token');
    if (token) {
      api.auth.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('dasig_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await api.auth.login(email, password);
    localStorage.setItem('dasig_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(body) {
    const data = await api.auth.register(body);
    localStorage.setItem('dasig_token', data.token);
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
