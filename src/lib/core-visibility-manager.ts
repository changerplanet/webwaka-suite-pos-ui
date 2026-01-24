/**
 * Core Visibility Manager
 * 
 * Provides read-only visibility into Core's view of POS data.
 * 
 * Canon Authority: Phase D-4.1 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * CRITICAL CANON RULES:
 * - POS is the permanent source of truth
 * - Core NEVER mutates POS data
 * - This is READ-ONLY visibility, not sync
 * - Offline-first guarantees preserved
 * 
 * Responsibilities:
 * - Fetch Core's view of inventory (read-only)
 * - Fetch Core's view of ledger events (read-only)
 * - Fetch sync status metadata
 * - Cache Core views for offline display
 * 
 * Explicitly FORBIDDEN:
 * - Core → POS data mutation
 * - Auto-correction of discrepancies
 * - Silent merging of data
 */

/**
 * Core inventory view (read-only replica)
 */
export interface CoreInventoryView {
  productId: string;
  sku: string;
  quantity: number;
  lastSyncedAt: number;
  source: 'core-replica'; // Always labeled as replica
}

/**
 * Core ledger event view (read-only)
 */
export interface CoreLedgerEventView {
  eventId: string;
  eventType: 'sale' | 'shift_open' | 'shift_close' | 'inventory_adjustment';
  status: 'received' | 'processing' | 'acknowledged' | 'failed';
  receivedAt: number;
  acknowledgedAt?: number;
  error?: string;
}

/**
 * Sync status metadata
 */
export interface SyncStatusMetadata {
  lastSyncTime: number | null;
  backlogSize: number;
  pendingEvents: number;
  failedEvents: number;
  isOnline: boolean;
}

/**
 * Core API configuration
 */
const CORE_API_BASE_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3001';
const CACHE_KEY_PREFIX = 'core_view_';

/**
 * Fetch Core's view of inventory (read-only)
 * 
 * @param tenantId - Tenant ID
 * @returns Array of Core inventory views or null if offline/failed
 */
export async function fetchCoreInventoryView(tenantId: string): Promise<CoreInventoryView[] | null> {
  try {
    const response = await fetch(`${CORE_API_BASE_URL}/inventory/view/tenant/${tenantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[CoreVisibilityManager] Failed to fetch Core inventory view:', response.status);
      return null;
    }

    const data = await response.json();
    return data.inventory as CoreInventoryView[];
  } catch (error) {
    console.warn('[CoreVisibilityManager] Network error fetching Core inventory view:', error);
    return null;
  }
}

/**
 * Fetch Core's view of ledger events (read-only)
 * 
 * @param tenantId - Tenant ID
 * @param limit - Maximum number of events to fetch
 * @returns Array of Core ledger event views or null if offline/failed
 */
export async function fetchCoreLedgerView(tenantId: string, limit: number = 100): Promise<CoreLedgerEventView[] | null> {
  try {
    const response = await fetch(`${CORE_API_BASE_URL}/ledger/view/tenant/${tenantId}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[CoreVisibilityManager] Failed to fetch Core ledger view:', response.status);
      return null;
    }

    const data = await response.json();
    return data.events as CoreLedgerEventView[];
  } catch (error) {
    console.warn('[CoreVisibilityManager] Network error fetching Core ledger view:', error);
    return null;
  }
}

/**
 * Fetch sync status metadata
 * 
 * @param tenantId - Tenant ID
 * @returns Sync status metadata or null if offline/failed
 */
export async function fetchSyncStatus(tenantId: string): Promise<SyncStatusMetadata | null> {
  try {
    const response = await fetch(`${CORE_API_BASE_URL}/sync/status/tenant/${tenantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[CoreVisibilityManager] Failed to fetch sync status:', response.status);
      return null;
    }

    const data = await response.json();
    return data as SyncStatusMetadata;
  } catch (error) {
    console.warn('[CoreVisibilityManager] Network error fetching sync status:', error);
    return null;
  }
}

/**
 * Cache Core view data to localStorage
 * 
 * @param key - Cache key
 * @param data - Data to cache
 */
function cacheData(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;

  try {
    const cacheEntry = {
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('[CoreVisibilityManager] Failed to cache data:', error);
  }
}

/**
 * Load cached Core view data from localStorage
 * 
 * @param key - Cache key
 * @returns Cached data or null
 */
function loadCachedData<T>(key: string): { data: T; cachedAt: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!cached) return null;

    return JSON.parse(cached) as { data: T; cachedAt: number };
  } catch (error) {
    console.warn('[CoreVisibilityManager] Failed to load cached data:', error);
    return null;
  }
}

/**
 * Get Core inventory view with caching
 * 
 * @param tenantId - Tenant ID
 * @returns Core inventory view with cache metadata
 */
export async function getCoreInventoryView(tenantId: string): Promise<{
  inventory: CoreInventoryView[];
  isFromCache: boolean;
  cachedAt: number | null;
} | null> {
  if (!navigator.onLine) {
    // Offline: use cached data
    const cached = loadCachedData<CoreInventoryView[]>(`inventory_${tenantId}`);
    if (cached) {
      console.log('[CoreVisibilityManager] Using cached Core inventory view (offline)');
      return {
        inventory: cached.data,
        isFromCache: true,
        cachedAt: cached.cachedAt,
      };
    }
    return null;
  }

  // Online: fetch fresh data
  const freshData = await fetchCoreInventoryView(tenantId);
  if (freshData) {
    cacheData(`inventory_${tenantId}`, freshData);
    return {
      inventory: freshData,
      isFromCache: false,
      cachedAt: null,
    };
  }

  // Fetch failed: fall back to cache
  const cached = loadCachedData<CoreInventoryView[]>(`inventory_${tenantId}`);
  if (cached) {
    console.log('[CoreVisibilityManager] Using cached Core inventory view (fetch failed)');
    return {
      inventory: cached.data,
      isFromCache: true,
      cachedAt: cached.cachedAt,
    };
  }

  return null;
}

/**
 * Get Core ledger view with caching
 * 
 * @param tenantId - Tenant ID
 * @param limit - Maximum number of events to fetch
 * @returns Core ledger view with cache metadata
 */
export async function getCoreLedgerView(tenantId: string, limit: number = 100): Promise<{
  events: CoreLedgerEventView[];
  isFromCache: boolean;
  cachedAt: number | null;
} | null> {
  if (!navigator.onLine) {
    // Offline: use cached data
    const cached = loadCachedData<CoreLedgerEventView[]>(`ledger_${tenantId}`);
    if (cached) {
      console.log('[CoreVisibilityManager] Using cached Core ledger view (offline)');
      return {
        events: cached.data,
        isFromCache: true,
        cachedAt: cached.cachedAt,
      };
    }
    return null;
  }

  // Online: fetch fresh data
  const freshData = await fetchCoreLedgerView(tenantId, limit);
  if (freshData) {
    cacheData(`ledger_${tenantId}`, freshData);
    return {
      events: freshData,
      isFromCache: false,
      cachedAt: null,
    };
  }

  // Fetch failed: fall back to cache
  const cached = loadCachedData<CoreLedgerEventView[]>(`ledger_${tenantId}`);
  if (cached) {
    console.log('[CoreVisibilityManager] Using cached Core ledger view (fetch failed)');
    return {
      events: cached.data,
      isFromCache: true,
      cachedAt: cached.cachedAt,
    };
  }

  return null;
}
