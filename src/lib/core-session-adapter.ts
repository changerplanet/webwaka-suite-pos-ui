/**
 * Core Session Adapter
 * 
 * This module provides a bridge between the POS suite and the WebWaka Core API
 * for identity, tenant, and partner resolution.
 * 
 * Canon Authority: Phase D-3.1 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * Responsibilities:
 * - Fetch session context from Core API when online
 * - Cache session context locally in IndexedDB
 * - Provide read-only session context to POS UI
 * - Preserve full offline functionality
 * 
 * Explicitly OUT OF SCOPE:
 * - Direct Clerk integration (handled upstream by Core)
 * - Business data writes to Core
 * - Inventory, sales, or payment sync
 */

import type { UserSession } from '@/types/core';

/**
 * Core API session response structure
 */
interface CoreSessionResponse {
  userId: string;
  tenantId: string;
  partnerId: string;
  username: string;
  roles: string[];
  expiresAt: number;
}

/**
 * Extended session with Core context
 */
export interface CoreAwareSession extends UserSession {
  partnerId: string;
  coreSessionId?: string;
  lastSyncedAt?: number;
}

/**
 * Core Session Adapter Configuration
 */
const CORE_API_BASE_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3001';
const SESSION_CACHE_KEY = 'core_session_cache';

/**
 * Fetch session context from Core API
 * 
 * @returns Core session response or null if offline/failed
 */
export async function fetchCoreSession(): Promise<CoreSessionResponse | null> {
  try {
    const response = await fetch(`${CORE_API_BASE_URL}/auth/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
      console.warn('[CoreSessionAdapter] Failed to fetch session:', response.status);
      return null;
    }

    const data = await response.json();
    return data as CoreSessionResponse;
  } catch (error) {
    console.warn('[CoreSessionAdapter] Network error fetching session:', error);
    return null;
  }
}

/**
 * Fetch tenant details from Core API
 * 
 * @returns Tenant details or null if offline/failed
 */
export async function fetchTenantDetails(): Promise<{ id: string; name: string } | null> {
  try {
    const response = await fetch(`${CORE_API_BASE_URL}/tenants/mine`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[CoreSessionAdapter] Failed to fetch tenant:', response.status);
      return null;
    }

    const data = await response.json();
    return data as { id: string; name: string };
  } catch (error) {
    console.warn('[CoreSessionAdapter] Network error fetching tenant:', error);
    return null;
  }
}

/**
 * Load cached Core session from localStorage
 * 
 * @returns Cached session or null
 */
export function loadCachedCoreSession(): CoreSessionResponse | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return null;

    const session = JSON.parse(cached) as CoreSessionResponse;
    
    // Check if session is expired
    if (session.expiresAt && session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.warn('[CoreSessionAdapter] Failed to load cached session:', error);
    return null;
  }
}

/**
 * Save Core session to localStorage cache
 * 
 * @param session - Core session to cache
 */
export function cacheCoreSession(session: CoreSessionResponse): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('[CoreSessionAdapter] Failed to cache session:', error);
  }
}

/**
 * Clear cached Core session
 */
export function clearCachedCoreSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch (error) {
    console.warn('[CoreSessionAdapter] Failed to clear cached session:', error);
  }
}

/**
 * Check if the device is online
 * 
 * @returns true if online, false otherwise
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.onLine;
}

/**
 * Resolve Core session context
 * 
 * This function attempts to fetch session from Core API when online,
 * falls back to cached session when offline, and preserves full offline functionality.
 * 
 * @returns Core session or null
 */
export async function resolveCoreSessionContext(): Promise<CoreSessionResponse | null> {
  // If online, attempt to fetch fresh session from Core
  if (isOnline()) {
    const freshSession = await fetchCoreSession();
    if (freshSession) {
      cacheCoreSession(freshSession);
      return freshSession;
    }
  }

  // Fall back to cached session (offline mode)
  const cachedSession = loadCachedCoreSession();
  if (cachedSession) {
    console.log('[CoreSessionAdapter] Using cached session (offline mode)');
    return cachedSession;
  }

  // No session available
  return null;
}
