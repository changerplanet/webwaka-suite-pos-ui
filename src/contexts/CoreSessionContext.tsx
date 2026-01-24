/**
 * Core Session Context
 * 
 * Provides Core-aware session context to the entire POS application.
 * 
 * Canon Authority: Phase D-3.1 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * Responsibilities:
 * - Provide read-only access to Core session context (userId, tenantId, partnerId)
 * - Automatically revalidate session when online
 * - Preserve offline functionality
 * - Track session lifecycle
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  resolveCoreSessionContext,
  isOnline,
  clearCachedCoreSession,
} from '@/lib/core-session-adapter';

interface CoreSessionContextValue {
  userId: string | null;
  tenantId: string | null;
  partnerId: string | null;
  isOnline: boolean;
  lastSyncedAt: number | null;
  revalidateSession: () => Promise<void>;
  clearSession: () => void;
}

const CoreSessionContext = createContext<CoreSessionContextValue | null>(null);

export function CoreSessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const revalidateSession = useCallback(async () => {
    if (!isOnline()) {
      console.log('[CoreSessionContext] Offline - skipping revalidation');
      return;
    }

    try {
      const coreSession = await resolveCoreSessionContext();
      if (coreSession) {
        setUserId(coreSession.userId);
        setTenantId(coreSession.tenantId);
        setPartnerId(coreSession.partnerId);
        setLastSyncedAt(Date.now());
      }
    } catch (error) {
      console.error('[CoreSessionContext] Failed to revalidate session:', error);
    }
  }, []);

  const clearSession = useCallback(() => {
    setUserId(null);
    setTenantId(null);
    setPartnerId(null);
    setLastSyncedAt(null);
    clearCachedCoreSession();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Automatically revalidate session when coming online
  useEffect(() => {
    if (online) {
      revalidateSession();
    }
  }, [online, revalidateSession]);

  // Periodic revalidation when online (every 5 minutes)
  useEffect(() => {
    if (!online) return;

    const interval = setInterval(() => {
      revalidateSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [online, revalidateSession]);

  const value: CoreSessionContextValue = {
    userId,
    tenantId,
    partnerId,
    isOnline: online,
    lastSyncedAt,
    revalidateSession,
    clearSession,
  };

  return (
    <CoreSessionContext.Provider value={value}>
      {children}
    </CoreSessionContext.Provider>
  );
}

export function useCoreSession() {
  const context = useContext(CoreSessionContext);
  if (!context) {
    throw new Error('useCoreSession must be used within CoreSessionProvider');
  }
  return context;
}
