'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { UserSession } from '@/types/core';
import {
  POS_CAPABILITIES,
  POS_ENTITLEMENTS,
  POS_FEATURE_FLAGS,
  getDefaultFeatureFlagValues,
} from '@/lib/control-consumer';

function createSessionFromControlDeclarations(username: string): UserSession {
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const defaultFlags = getDefaultFeatureFlagValues();
  
  return {
    id: `session_${uniqueId}`,
    userId: `user_${username}`,
    username,
    tenantId: 'tenant_demo',
    permissions: POS_CAPABILITIES.map(cap => ({
      id: cap.id,
      name: cap.id,
      granted: true,
    })),
    entitlements: POS_ENTITLEMENTS.map(ent => ({
      id: ent.id,
      featureKey: ent.id,
      enabled: true,
    })),
    featureFlags: POS_FEATURE_FLAGS.map(flag => ({
      id: flag.id,
      key: flag.id,
      enabled: defaultFlags[flag.id] ?? flag.defaultValue,
    })),
    dashboardSections: [],
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  };
}

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
      const newSession = createSessionFromControlDeclarations(username);
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
