import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('ss_token'));

  const logout = useCallback(() => {
    localStorage.removeItem('ss_token');
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  // Restore session on page load
  useEffect(() => {
    if (!localStorage.getItem('ss_token')) return;
    refresh().catch(logout).finally(() => setLoading(false));
  }, [refresh, logout]);

  // Interceptor fires this when the server rejects the token
  useEffect(() => {
    window.addEventListener('ss-logout', logout);
    return () => window.removeEventListener('ss-logout', logout);
  }, [logout]);

  const authenticate = async (path, payload) => {
    const { data } = await api.post(path, payload);
    localStorage.setItem('ss_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const value = {
    user, loading, setUser, refresh, logout,
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (payload) => authenticate('/auth/register', payload),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
