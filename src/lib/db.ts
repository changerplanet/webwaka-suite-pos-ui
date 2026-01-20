import Dexie, { type EntityTable } from 'dexie';
import type { 
  Product, 
  CartItem, 
  Sale, 
  Shift, 
  Receipt, 
  SyncEvent,
  UserSession 
} from '@/types/core';

class POSDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>;
  cartItems!: EntityTable<CartItem, 'id'>;
  sales!: EntityTable<Sale, 'id'>;
  shifts!: EntityTable<Shift, 'id'>;
  receipts!: EntityTable<Receipt, 'id'>;
  syncEvents!: EntityTable<SyncEvent, 'id'>;
  sessions!: EntityTable<UserSession, 'id'>;

  constructor() {
    super('WebWakaPOS');
    
    this.version(1).stores({
      products: 'id, sku, name, categoryId, available',
      cartItems: 'id, productId',
      sales: 'id, shiftId, tenantId, status, createdAt, syncedAt',
      shifts: 'id, userId, tenantId, status, openedAt',
      receipts: 'id, saleId, tenantId, createdAt',
      syncEvents: 'id, type, status, createdAt, syncedAt',
      sessions: 'id, userId, tenantId',
    });
  }
}

export const db = new POSDatabase();

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

export async function exportData(): Promise<Record<string, unknown[]>> {
  const data: Record<string, unknown[]> = {};
  for (const table of db.tables) {
    data[table.name] = await table.toArray();
  }
  return data;
}
