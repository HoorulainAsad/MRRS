import { useCallback, useMemo, useState } from 'react';
import {
  getDemoSession,
  loginDemo,
} from '../services/sessionService';
import { SessionContext } from './SessionContext';

const STORAGE_KEY = 'smart-workspace.demo-user';

function restoreDemoSession() {
  const userId = window.localStorage.getItem(STORAGE_KEY);
  if (!userId) return null;

  try {
    return getDemoSession(userId);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(restoreDemoSession);

  const persistSession = useCallback((nextSession) => {
    window.localStorage.setItem(STORAGE_KEY, nextSession.userId);
    setSession(nextSession);
  }, []);

  const login = useCallback(async (credentials) => {
    const nextSession = await loginDemo(credentials);
    persistSession(nextSession);
    return nextSession;
  }, [persistSession]);

  const switchDemoUser = useCallback((userId) => {
    const nextSession = getDemoSession(userId);
    persistSession(nextSession);
    return nextSession;
  }, [persistSession]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    session,
    login,
    logout,
    switchDemoUser,
  }), [session, login, logout, switchDemoUser]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
