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
import {
  resolveCoreSessionContext,
  clearCachedCoreSession,
  isOnline,
} from '@/lib/core-session-adapter';
import { CANONICAL_DEMO_TENANT_SLUG } from '@/lib/demo-safety-guard';

function createSessionFromControlDeclarations(
  username: string,
  coreContext?: { userId: string; tenantId: string; partnerId: string }
): UserSession {
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const defaultFlags = getDefaultFeatureFlagValues();
  
  return {
    id: `session_${uniqueId}`,
    userId: coreContext?.userId || `user_${username}`,
    username,
    // Phase D-5: Use canonical demo tenant slug as fallback when offline
    tenantId: coreContext?.tenantId || CANONICAL_DEMO_TENANT_SLUG,
    partnerId: coreContext?.partnerId,
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
      // Phase D-3.1: Attempt to resolve Core session context when online
      let coreContext: { userId: string; tenantId: string; partnerId: string } | undefined;
      
      if (isOnline()) {
        const coreSession = await resolveCoreSessionContext();
        if (coreSession) {
          coreContext = {
            userId: coreSession.userId,
            tenantId: coreSession.tenantId,
            partnerId: coreSession.partnerId,
          };
        }
      }

      const newSession = createSessionFromControlDeclarations(username, coreContext);
      await db.sessions.add(newSession);
      setSession(newSession);
      return true;
    } catch (error) {
      console.error('[useSession] Login failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (session) {
      await db.sessions.delete(session.id);
    }
    // Phase D-3.1: Clear cached Core session on logout
    clearCachedCoreSession();
    setSession(null);
  }, [session]);

  return { session, loading, login, logout };
}
