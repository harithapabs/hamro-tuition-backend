import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

function hasAuthCookie() {
  return document.cookie.split(';').some(c => c.trim().startsWith('ht_token='));
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!hasAuthCookie()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password, captcha) => {
    const payload = { email, password };
    if (captcha) { payload.captchaId = captcha.id; payload.captchaAnswer = captcha.answer; }
    const { data } = await authAPI.login(payload);
    if (data.requires2FA) {
      setRequires2FA({ twoFactorToken: data.twoFactorToken });
      return { requires2FA: true };
    }
    setUser(data.user);
    return data.user;
  };

  const verify2FA = async (email, password, twoFactorCode) => {
    const { data } = await authAPI.login({ email, password, twoFactorCode });
    if (data.requires2FA) {
      setRequires2FA({ twoFactorToken: data.twoFactorToken });
      return { requires2FA: true };
    }
    setRequires2FA(null);
    setUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await authAPI.register(form);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    setUser(null);
    setRequires2FA(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, verify2FA, requires2FA, setRequires2FA }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
