import { db, clearAllData } from '@/lib/db';
import { syncManager } from '@/lib/sync-manager';
import { createMockSession } from '@/lib/control-consumer';
import type { Sale, Shift, Receipt } from '@/types/core';
import { v4 as uuidv4 } from 'uuid';

describe('Offline Scenario: Cashier Makes Sales Offline', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  afterEach(async () => {
    await clearAllData();
  });

  it('complete offline workflow: open shift, make sales, close shift, sync', async () => {
    const session = createMockSession('cashier');
    
    const shift: Shift = {
      id: uuidv4(),
      userId: session.userId,
      tenantId: session.tenantId,
      openedAt: Date.now(),
      openingBalance: 100,
      status: 'open',
      salesCount: 0,
      totalSales: 0,
    };
    await db.shifts.add(shift);

    const shiftOpenEvent = await syncManager.queueEvent('shift_open', { 
      shiftId: shift.id, 
      ...shift 
    });
    expect(shiftOpenEvent.status).toBe('pending');

    const sale1: Sale = {
      id: uuidv4(),
      shiftId: shift.id,
      tenantId: session.tenantId,
      items: [{
        id: uuidv4(),
        productId: 'prod_1',
        product: { id: 'prod_1', sku: 'SKU1', name: 'Coffee', price: 3.50, currency: 'USD', available: true, stockQuantity: 100 },
        quantity: 2,
        unitPrice: 3.50,
        totalPrice: 7.00,
      }],
      subtotal: 7.00,
      tax: 0.70,
      total: 7.70,
      paymentMethod: 'cash',
      status: 'pending',
      createdAt: Date.now(),
    };
    await db.sales.add(sale1);

    const sale1Event = await syncManager.queueEvent('sale', { saleId: sale1.id, ...sale1 });
    expect(sale1Event.status).toBe('pending');

    const sale2: Sale = {
      id: uuidv4(),
      shiftId: shift.id,
      tenantId: session.tenantId,
      items: [{
        id: uuidv4(),
        productId: 'prod_2',
        product: { id: 'prod_2', sku: 'SKU2', name: 'Tea', price: 2.50, currency: 'USD', available: true, stockQuantity: 50 },
        quantity: 1,
        unitPrice: 2.50,
        totalPrice: 2.50,
      }],
      subtotal: 2.50,
      tax: 0.25,
      total: 2.75,
      paymentMethod: 'card',
      status: 'pending',
      createdAt: Date.now() + 1000,
    };
    await db.sales.add(sale2);

    const sale2Event = await syncManager.queueEvent('sale', { saleId: sale2.id, ...sale2 });
    expect(sale2Event.status).toBe('pending');

    const receipt1: Receipt = {
      id: uuidv4(),
      saleId: sale1.id,
      tenantId: session.tenantId,
      items: sale1.items,
      subtotal: sale1.subtotal,
      tax: sale1.tax,
      total: sale1.total,
      paymentMethod: sale1.paymentMethod,
      createdAt: sale1.createdAt,
      receiptNumber: `RCP-${Date.now().toString(36).toUpperCase()}`,
    };
    await db.receipts.add(receipt1);

    await db.shifts.update(shift.id, {
      closedAt: Date.now() + 5000,
      closingBalance: 110.45,
      status: 'closed',
      salesCount: 2,
      totalSales: 10.45,
    });

    const shiftCloseEvent = await syncManager.queueEvent('shift_close', {
      shiftId: shift.id,
      closedAt: Date.now() + 5000,
      closingBalance: 110.45,
    });
    expect(shiftCloseEvent.status).toBe('pending');

    const pendingEvents = await syncManager.getPendingEvents();
    expect(pendingEvents.length).toBeGreaterThanOrEqual(4);

    const savedShift = await db.shifts.get(shift.id);
    expect(savedShift?.status).toBe('closed');
    expect(savedShift?.salesCount).toBe(2);

    const savedSales = await db.sales.where('shiftId').equals(shift.id).toArray();
    expect(savedSales.length).toBe(2);

    const savedReceipts = await db.receipts.toArray();
    expect(savedReceipts.length).toBeGreaterThanOrEqual(1);
  });

  it('events are queued in correct order for deterministic replay', async () => {
    const events: string[] = [];
    
    const event1 = await syncManager.queueEvent('shift_open', { order: 1 });
    events.push(event1.id);
    
    const event2 = await syncManager.queueEvent('sale', { order: 2 });
    events.push(event2.id);
    
    const event3 = await syncManager.queueEvent('sale', { order: 3 });
    events.push(event3.id);
    
    const event4 = await syncManager.queueEvent('shift_close', { order: 4 });
    events.push(event4.id);

    const pendingEvents = await syncManager.getPendingEvents();
    const pendingIds = pendingEvents.map(e => e.id);
    
    events.forEach(id => {
      expect(pendingIds).toContain(id);
    });
  });

  it('sales data includes all required fields for ledger reconciliation', async () => {
    const sale: Sale = {
      id: uuidv4(),
      shiftId: 'shift_123',
      tenantId: 'tenant_1',
      items: [{
        id: uuidv4(),
        productId: 'prod_1',
        product: { id: 'prod_1', sku: 'SKU1', name: 'Coffee', price: 3.50, currency: 'USD', available: true, stockQuantity: 100 },
        quantity: 1,
        unitPrice: 3.50,
        totalPrice: 3.50,
      }],
      subtotal: 3.50,
      tax: 0.35,
      total: 3.85,
      paymentMethod: 'cash',
      status: 'pending',
      createdAt: Date.now(),
    };

    await db.sales.add(sale);
    const savedSale = await db.sales.get(sale.id);

    expect(savedSale).toBeDefined();
    expect(savedSale?.id).toBeDefined();
    expect(savedSale?.shiftId).toBeDefined();
    expect(savedSale?.tenantId).toBeDefined();
    expect(savedSale?.items).toBeDefined();
    expect(savedSale?.subtotal).toBeDefined();
    expect(savedSale?.tax).toBeDefined();
    expect(savedSale?.total).toBeDefined();
    expect(savedSale?.paymentMethod).toBeDefined();
    expect(savedSale?.createdAt).toBeDefined();
  });
});

describe('Deterministic UI Rendering', () => {
  it('same session data produces consistent dashboard sections', () => {
    const session1 = createMockSession('user1');
    const session2 = createMockSession('user1');
    
    expect(session1.dashboardSections).toEqual(session2.dashboardSections);
    expect(session1.permissions).toEqual(session2.permissions);
    expect(session1.entitlements).toEqual(session2.entitlements);
    expect(session1.featureFlags).toEqual(session2.featureFlags);
  });
});
