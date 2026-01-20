'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { UserSession } from '@/types/core';
import { createMockSession } from '@/lib/control-consumer';

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sessions = await db.sessions.toArray();
      const validSession = sessions.find(s => s.expiresAt > Date.now());
      setSession(validSession || null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (username: string, _password: string): Promise<boolean> => {
    try {
      const newSession = createMockSession(username);
      await db.sessions.add(newSession);
      setSession(newSession);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (session) {
      await db.sessions.delete(session.id);
    }
    setSession(null);
  }, [session]);

  return { session, loading, login, logout };
}
