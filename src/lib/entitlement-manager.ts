/**
 * Entitlement Manager
 * 
 * Manages capability and entitlement enforcement for the POS suite.
 * 
 * Canon Authority: Phase D-3.2 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * Responsibilities:
 * - Fetch entitlements from Core API when online
 * - Cache entitlements locally
 * - Provide read-only entitlement checks
 * - Preserve offline functionality
 * 
 * Explicitly OUT OF SCOPE:
 * - Blocking POS operations based on entitlements
 * - Writing any data to Core
 * - Mutating inventory, pricing, or sales data
 */

import type { Entitlement, FeatureFlag } from '@/types/core';

/**
 * Core API entitlement response structure
 */
export interface CoreEntitlementResponse {
  tenantId: string;
  partnerId: string;
  entitlements: Entitlement[];
  featureFlags: FeatureFlag[];
  expiresAt: number;
}

/**
 * Entitlement cache configuration
 */
const CORE_API_BASE_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3001';
const ENTITLEMENT_CACHE_KEY = 'pos_entitlements_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch entitlements from Core API
 * 
 * @param tenantId - Tenant ID to fetch entitlements for
 * @returns Entitlement response or null if offline/failed
 */
export async function fetchEntitlementsFromCore(tenantId: string): Promise<CoreEntitlementResponse | null> {
  try {
    const response = await fetch(`${CORE_API_BASE_URL}/entitlements/tenant/${tenantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[EntitlementManager] Failed to fetch entitlements:', response.status);
      return null;
    }

    const data = await response.json();
    return data as CoreEntitlementResponse;
  } catch (error) {
    console.warn('[EntitlementManager] Network error fetching entitlements:', error);
    return null;
  }
}

/**
 * Load cached entitlements from localStorage
 * 
 * @returns Cached entitlements or null
 */
export function loadCachedEntitlements(): CoreEntitlementResponse | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(ENTITLEMENT_CACHE_KEY);
    if (!cached) return null;

    const entitlements = JSON.parse(cached) as CoreEntitlementResponse;
    
    // Check if cache is expired
    if (entitlements.expiresAt && entitlements.expiresAt < Date.now()) {
      localStorage.removeItem(ENTITLEMENT_CACHE_KEY);
      return null;
    }

    return entitlements;
  } catch (error) {
    console.warn('[EntitlementManager] Failed to load cached entitlements:', error);
    return null;
  }
}

/**
 * Cache entitlements to localStorage
 * 
 * @param entitlements - Entitlements to cache
 */
export function cacheEntitlements(entitlements: CoreEntitlementResponse): void {
  if (typeof window === 'undefined') return;

  try {
    // Set expiration time
    const entitlementsWithExpiry = {
      ...entitlements,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    localStorage.setItem(ENTITLEMENT_CACHE_KEY, JSON.stringify(entitlementsWithExpiry));
  } catch (error) {
    console.warn('[EntitlementManager] Failed to cache entitlements:', error);
  }
}

/**
 * Clear cached entitlements
 */
export function clearCachedEntitlements(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(ENTITLEMENT_CACHE_KEY);
  } catch (error) {
    console.warn('[EntitlementManager] Failed to clear cached entitlements:', error);
  }
}

/**
 * Check if the device is online
 * 
 * @returns true if online, false otherwise
 */
function isOnline(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.onLine;
}

/**
 * Resolve entitlements for a tenant
 * 
 * This function attempts to fetch entitlements from Core API when online,
 * falls back to cached entitlements when offline.
 * 
 * @param tenantId - Tenant ID
 * @returns Entitlements or null
 */
export async function resolveEntitlements(tenantId: string): Promise<CoreEntitlementResponse | null> {
  // If online, attempt to fetch fresh entitlements from Core
  if (isOnline()) {
    const freshEntitlements = await fetchEntitlementsFromCore(tenantId);
    if (freshEntitlements) {
      cacheEntitlements(freshEntitlements);
      return freshEntitlements;
    }
  }

  // Fall back to cached entitlements (offline mode)
  const cachedEntitlements = loadCachedEntitlements();
  if (cachedEntitlements) {
    console.log('[EntitlementManager] Using cached entitlements (offline mode)');
    return cachedEntitlements;
  }

  // No entitlements available
  return null;
}

/**
 * Check if a specific entitlement is enabled
 * 
 * @param entitlements - Entitlement response
 * @param featureKey - Feature key to check
 * @returns true if enabled, false otherwise
 */
export function isEntitlementEnabled(
  entitlements: CoreEntitlementResponse | null,
  featureKey: string
): boolean {
  if (!entitlements) return false;

  const entitlement = entitlements.entitlements.find(e => e.featureKey === featureKey);
  return entitlement?.enabled ?? false;
}

/**
 * Check if a specific feature flag is enabled
 * 
 * @param entitlements - Entitlement response
 * @param flagKey - Flag key to check
 * @returns true if enabled, false otherwise
 */
export function isFeatureFlagEnabled(
  entitlements: CoreEntitlementResponse | null,
  flagKey: string
): boolean {
  if (!entitlements) return false;

  const flag = entitlements.featureFlags.find(f => f.key === flagKey);
  return flag?.enabled ?? false;
}

/**
 * Get Demo Partner entitlements (all features enabled)
 * 
 * This is a special case for the Demo Partner, which always has full access.
 * 
 * @param tenantId - Tenant ID
 * @param partnerId - Partner ID
 * @returns Demo entitlements
 */
export function getDemoPartnerEntitlements(tenantId: string, partnerId: string): CoreEntitlementResponse {
  return {
    tenantId,
    partnerId,
    entitlements: [
      { id: 'pos-offline-sales', featureKey: 'pos-offline-sales', enabled: true },
      { id: 'pos-cash-rounding', featureKey: 'pos-cash-rounding', enabled: true },
      { id: 'pos-shift-management', featureKey: 'pos-shift-management', enabled: true },
      { id: 'pos-receipt-generation', featureKey: 'pos-receipt-generation', enabled: true },
    ],
    featureFlags: [
      { id: 'pos-nigeria-first', key: 'pos-nigeria-first', enabled: true },
      { id: 'pos-offline-first', key: 'pos-offline-first', enabled: true },
    ],
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
}
