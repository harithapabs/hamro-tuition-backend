import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
  verify2FA: async () => null,
  requires2FA: null,
  setRequires2FA: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data || null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password, captcha) => {
    try {
      const payload = { email, password };
      if (captcha) { payload.captchaId = captcha.id; payload.captchaAnswer = captcha.answer; }
      const { data } = await authAPI.login(payload);
      if (data?.requires2FA) {
        setRequires2FA({ twoFactorToken: data.twoFactorToken });
        return { requires2FA: true };
      }
      setUser(data?.user || null);
      return data?.user || null;
    } catch (err) {
      throw err;
    }
  };

  const verify2FA = async (email, password, twoFactorCode) => {
    try {
      const { data } = await authAPI.login({ email, password, twoFactorCode });
      if (data?.requires2FA) {
        setRequires2FA({ twoFactorToken: data.twoFactorToken });
        return { requires2FA: true };
      }
      setRequires2FA(null);
      setUser(data?.user || null);
      return data?.user || null;
    } catch (err) {
      throw err;
    }
  };

  const register = async (form) => {
    try {
      const { data } = await authAPI.register(form);
      setUser(data?.user || null);
      return data?.user || null;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    setUser(null);
    setRequires2FA(null);
  };

  const value = { user, setUser, loading, login, register, logout, verify2FA, requires2FA, setRequires2FA };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
