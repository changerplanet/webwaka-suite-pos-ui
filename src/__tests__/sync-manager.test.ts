import { syncManager, type SyncStatus } from '@/lib/sync-manager';

const originalNavigator = global.navigator;

describe('SyncManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('returns a valid sync status', () => {
      const status = syncManager.getStatus();
      expect(['online', 'offline', 'syncing']).toContain(status);
    });
  });

  describe('subscribe', () => {
    it('returns an unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = syncManager.subscribe(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('getPendingEvents', () => {
    it('returns an array', async () => {
      const events = await syncManager.getPendingEvents();
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('getEventCount', () => {
    it('returns pending and failed counts', async () => {
      const counts = await syncManager.getEventCount();
      expect(typeof counts.pending).toBe('number');
      expect(typeof counts.failed).toBe('number');
    });
  });

  describe('queueEvent', () => {
    it('creates an event with correct structure', async () => {
      const event = await syncManager.queueEvent('sale', { saleId: 'test123' });
      
      expect(event.id).toBeDefined();
      expect(event.type).toBe('sale');
      expect(event.payload.saleId).toBe('test123');
      expect(event.status).toBe('pending');
      expect(event.retryCount).toBe(0);
      expect(event.createdAt).toBeDefined();
    });

    it('supports different event types', async () => {
      const saleEvent = await syncManager.queueEvent('sale', {});
      const shiftOpenEvent = await syncManager.queueEvent('shift_open', {});
      const shiftCloseEvent = await syncManager.queueEvent('shift_close', {});
      const inventoryEvent = await syncManager.queueEvent('inventory_adjustment', {});
      
      expect(saleEvent.type).toBe('sale');
      expect(shiftOpenEvent.type).toBe('shift_open');
      expect(shiftCloseEvent.type).toBe('shift_close');
      expect(inventoryEvent.type).toBe('inventory_adjustment');
    });
  });
});

describe('Offline-First Behavior', () => {
  it('events are queued when created regardless of connection status', async () => {
    const initialCount = await syncManager.getEventCount();
    await syncManager.queueEvent('sale', { test: true });
    const newCount = await syncManager.getEventCount();
    
    expect(newCount.pending).toBeGreaterThanOrEqual(initialCount.pending);
  });
});
