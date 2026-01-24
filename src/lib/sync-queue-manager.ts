/**
 * Sync Queue Manager
 * 
 * Manages one-way, append-only synchronization from POS to Core.
 * 
 * Canon Authority: Phase D-3.3 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * Responsibilities:
 * - Queue POS events for sync to Core
 * - Push events to Core when online (append-only)
 * - Implement retry and backoff logic
 * - Preserve offline functionality
 * 
 * CRITICAL RULES:
 * - POS → Core ONLY (one-way sync)
 * - Append-only writes (no updates or deletes)
 * - POS ALWAYS WINS in conflict resolution
 * - Eventual consistency model
 * 
 * Explicitly FORBIDDEN:
 * - Core → POS writes
 * - Inventory overrides from Core
 * - Deletions or updates
 * - Multi-directional sync
 */

import { db } from './db';
import type { SyncEvent } from '@/types/core';

/**
 * Sync configuration
 */
const CORE_API_BASE_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3001';
const SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds
const MAX_RETRY_COUNT = 5;
const RETRY_BACKOFF_MS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

/**
 * Sync event types
 */
export type SyncEventType = 'sale' | 'shift_open' | 'shift_close' | 'inventory_adjustment';

/**
 * Create a sync event
 * 
 * @param type - Event type
 * @param payload - Event payload
 * @returns Created sync event
 */
export async function createSyncEvent(type: SyncEventType, payload: Record<string, unknown>): Promise<SyncEvent> {
  const event: SyncEvent = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  await db.syncEvents.add(event);
  return event;
}

/**
 * Get all pending sync events
 * 
 * @returns Array of pending sync events
 */
export async function getPendingSyncEvents(): Promise<SyncEvent[]> {
  return await db.syncEvents
    .where('status')
    .equals('pending')
    .toArray();
}

/**
 * Push a single sync event to Core
 * 
 * @param event - Sync event to push
 * @returns true if successful, false otherwise
 */
async function pushSyncEventToCore(event: SyncEvent): Promise<boolean> {
  try {
    const response = await fetch(`${CORE_API_BASE_URL}/sync/pos-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        eventId: event.id,
        eventType: event.type,
        payload: event.payload,
        createdAt: event.createdAt,
      }),
    });

    if (!response.ok) {
      console.warn(`[SyncQueueManager] Failed to push event ${event.id}:`, response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`[SyncQueueManager] Network error pushing event ${event.id}:`, error);
    return false;
  }
}

/**
 * Mark a sync event as synced
 * 
 * @param eventId - Event ID
 */
async function markEventAsSynced(eventId: string): Promise<void> {
  await db.syncEvents.update(eventId, {
    status: 'synced',
    syncedAt: Date.now(),
  });
}

/**
 * Mark a sync event as failed
 * 
 * @param eventId - Event ID
 * @param error - Error message
 */
async function markEventAsFailed(eventId: string, error: string): Promise<void> {
  const event = await db.syncEvents.get(eventId);
  if (!event) return;

  await db.syncEvents.update(eventId, {
    status: 'failed',
    error,
    retryCount: event.retryCount + 1,
  });
}

/**
 * Retry a failed sync event
 * 
 * @param eventId - Event ID
 */
async function retryFailedEvent(eventId: string): Promise<void> {
  const event = await db.syncEvents.get(eventId);
  if (!event) return;

  // Check if retry limit exceeded
  if (event.retryCount >= MAX_RETRY_COUNT) {
    console.error(`[SyncQueueManager] Event ${eventId} exceeded retry limit`);
    return;
  }

  // Calculate backoff delay
  const backoffDelay = RETRY_BACKOFF_MS[Math.min(event.retryCount, RETRY_BACKOFF_MS.length - 1)];
  
  // Wait for backoff period
  await new Promise(resolve => setTimeout(resolve, backoffDelay));

  // Reset status to pending for retry
  await db.syncEvents.update(eventId, {
    status: 'pending',
  });
}

/**
 * Process the sync queue
 * 
 * This function processes all pending sync events and pushes them to Core.
 * It implements retry logic with exponential backoff.
 * 
 * @returns Number of events successfully synced
 */
export async function processSyncQueue(): Promise<number> {
  if (!navigator.onLine) {
    console.log('[SyncQueueManager] Offline - skipping sync');
    return 0;
  }

  const pendingEvents = await getPendingSyncEvents();
  if (pendingEvents.length === 0) {
    return 0;
  }

  console.log(`[SyncQueueManager] Processing ${pendingEvents.length} pending events`);

  let syncedCount = 0;

  for (const event of pendingEvents) {
    const success = await pushSyncEventToCore(event);

    if (success) {
      await markEventAsSynced(event.id);
      syncedCount++;
    } else {
      await markEventAsFailed(event.id, 'Failed to push to Core');
      
      // Schedule retry if under retry limit
      if (event.retryCount < MAX_RETRY_COUNT) {
        await retryFailedEvent(event.id);
      }
    }
  }

  console.log(`[SyncQueueManager] Synced ${syncedCount}/${pendingEvents.length} events`);
  return syncedCount;
}

/**
 * Start automatic sync queue processing
 * 
 * This function starts a background process that automatically processes
 * the sync queue at regular intervals.
 * 
 * @returns Stop function to halt automatic sync
 */
export function startAutomaticSync(): () => void {
  console.log('[SyncQueueManager] Starting automatic sync');

  const intervalId = setInterval(async () => {
    await processSyncQueue();
  }, SYNC_INTERVAL_MS);

  // Also process immediately when coming online
  const onlineHandler = () => {
    console.log('[SyncQueueManager] Device came online - processing queue');
    processSyncQueue();
  };

  window.addEventListener('online', onlineHandler);

  // Return stop function
  return () => {
    clearInterval(intervalId);
    window.removeEventListener('online', onlineHandler);
    console.log('[SyncQueueManager] Stopped automatic sync');
  };
}

/**
 * Get sync queue statistics
 * 
 * @returns Sync queue stats
 */
export async function getSyncQueueStats(): Promise<{
  pending: number;
  synced: number;
  failed: number;
  total: number;
}> {
  const allEvents = await db.syncEvents.toArray();

  return {
    pending: allEvents.filter(e => e.status === 'pending').length,
    synced: allEvents.filter(e => e.status === 'synced').length,
    failed: allEvents.filter(e => e.status === 'failed').length,
    total: allEvents.length,
  };
}
