import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import {
  TAB_ID, channel, broadcast,
  readAuth, writeAuth,
  claimTab, releaseTab, isActiveTab,
} from '../utils/tabSession';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => readAuth());   // instant from localStorage
  const [loading, setLoading] = useState(!readAuth());        // skip spinner if cache hit
  const [blockedTab, setBlockedTab] = useState(false);        // another tab owns the session

  // ── Server session verification ──────────────────────────────────────────
  const checkAuth = useCallback(async (silent = false) => {
    try {
      const res = await authAPI.getMe();
      const u = res.data.user;
      writeAuth(u);
      setUser(u);
      if (!silent) setLoading(false);
    } catch {
      writeAuth(null);
      setUser(null);
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Re-verify silently whenever this tab regains focus
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkAuth(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [checkAuth]);

  // ── Cross-tab BroadcastChannel listener ──────────────────────────────────
  useEffect(() => {
    if (!channel) return;
    const handleMsg = ({ data }) => {
      if (data.tabId === TAB_ID) return; // ignore own messages

      if (data.type === 'LOGOUT') {
        writeAuth(null);
        setUser(null);
        setBlockedTab(false);
        window.location.replace('/login');
      }

      if (data.type === 'LOGIN') {
        // Another tab logged in — update local auth cache silently
        if (data.user) { writeAuth(data.user); setUser(data.user); }
      }

      if (data.type === 'CLAIM') {
        // Another tab claimed the session — block this tab if we also had a session
        if (user) setBlockedTab(true);
      }
    };
    channel.addEventListener('message', handleMsg);
    return () => channel.removeEventListener('message', handleMsg);
  }, [user]);

  // ── localStorage 'storage' event (cross-tab fallback for LOGOUT) ─────────
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'shiv_auth_user' && e.newValue === null) {
        // Auth cleared in another tab — log this tab out too
        setUser(null);
        setBlockedTab(false);
        window.location.replace('/login');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Release tab lock on unload ────────────────────────────────────────────
  useEffect(() => {
    window.addEventListener('beforeunload', releaseTab);
    return () => window.removeEventListener('beforeunload', releaseTab);
  }, []);

  // ── Public auth API ──────────────────────────────────────────────────────
  const login = (userData) => {
    writeAuth(userData);
    setUser(userData);
    setBlockedTab(false);
    claimTab();
    broadcast('LOGIN', { user: userData });
  };

  const logout = async (skipApi = false) => {
    releaseTab();
    writeAuth(null);
    setUser(null);
    setBlockedTab(false);
    broadcast('LOGOUT');
    if (!skipApi) {
      try { await authAPI.logout(); } catch { /* ignore */ }
    }
  };

  // ── Check if another tab already owns the session ─────────────────────────
  const claimSession = useCallback(() => {
    if (!isActiveTab()) {
      setBlockedTab(true);
      return false;
    }
    claimTab();
    broadcast('CLAIM');
    return true;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, blockedTab, login, logout, claimSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
