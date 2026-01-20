import { db } from './db';
import type { SyncEvent } from '@/types/core';
import { v4 as uuidv4 } from 'uuid';

export type SyncStatus = 'online' | 'offline' | 'syncing';

class SyncManager {
  private status: SyncStatus = 'offline';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeOnlineListener();
    }
  }

  private initializeOnlineListener(): void {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    this.status = navigator.onLine ? 'online' : 'offline';
  }

  private handleOnline(): void {
    this.setStatus('online');
    this.startSyncLoop();
  }

  private handleOffline(): void {
    this.setStatus('offline');
    this.stopSyncLoop();
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public async queueEvent(
    type: SyncEvent['type'],
    payload: Record<string, unknown>
  ): Promise<SyncEvent> {
    const event: SyncEvent = {
      id: uuidv4(),
      type,
      payload,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await db.syncEvents.add(event);

    if (this.status === 'online') {
      this.syncNow();
    }

    return event;
  }

  public async getPendingEvents(): Promise<SyncEvent[]> {
    return db.syncEvents.where('status').equals('pending').toArray();
  }

  public async getEventCount(): Promise<{ pending: number; failed: number }> {
    const pending = await db.syncEvents.where('status').equals('pending').count();
    const failed = await db.syncEvents.where('status').equals('failed').count();
    return { pending, failed };
  }

  private async syncNow(): Promise<void> {
    if (this.status !== 'online') return;

    this.setStatus('syncing');

    try {
      const pendingEvents = await this.getPendingEvents();

      for (const event of pendingEvents) {
        try {
          await this.syncEvent(event);
          await db.syncEvents.update(event.id, {
            status: 'synced',
            syncedAt: Date.now(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await db.syncEvents.update(event.id, {
            retryCount: event.retryCount + 1,
            error: errorMessage,
            status: event.retryCount >= 3 ? 'failed' : 'pending',
          });
        }
      }

      this.setStatus('online');
    } catch {
      this.setStatus('offline');
    }
  }

  private async syncEvent(event: SyncEvent): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (event.type === 'sale') {
      const saleId = event.payload.saleId as string;
      if (saleId) {
        await db.sales.update(saleId, { 
          status: 'completed', 
          syncedAt: Date.now() 
        });
      }
    }
  }

  private startSyncLoop(): void {
    if (this.syncInterval) return;
    this.syncInterval = setInterval(() => this.syncNow(), 30000);
    this.syncNow();
  }

  private stopSyncLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  public async forceSync(): Promise<void> {
    if (navigator.onLine) {
      this.setStatus('online');
      await this.syncNow();
    }
  }
}

export const syncManager = new SyncManager();
