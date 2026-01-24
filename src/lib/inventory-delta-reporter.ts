/**
 * Inventory Delta Reporter
 * 
 * Reports inventory changes (deltas) from POS to Core.
 * 
 * Canon Authority: Phase D-3.3 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * Responsibilities:
 * - Track inventory deltas (sales-driven decrements)
 * - Report deltas to Core (append-only)
 * - Preserve POS as source of truth
 * 
 * CRITICAL RULES:
 * - POS → Core ONLY (one-way reporting)
 * - Deltas are informational, not authoritative
 * - POS inventory is NEVER overridden by Core
 * - Eventual consistency model
 * 
 * Explicitly FORBIDDEN:
 * - Core → POS inventory updates
 * - Inventory overrides from Core
 * - Deletions or corrections from Core
 */

import { createSyncEvent } from './sync-queue-manager';

/**
 * Inventory delta event payload
 */
export interface InventoryDelta {
  productId: string;
  sku: string;
  deltaQuantity: number; // Negative for decrements, positive for increments
  reason: 'sale' | 'adjustment' | 'restock';
  saleId?: string; // Reference to sale if delta is from a sale
  timestamp: number;
  tenantId: string;
}

/**
 * Report an inventory delta to Core
 * 
 * This function creates a sync event for an inventory delta.
 * The delta will be pushed to Core when online.
 * 
 * @param delta - Inventory delta to report
 */
export async function reportInventoryDelta(delta: InventoryDelta): Promise<void> {
  await createSyncEvent('inventory_adjustment', {
    productId: delta.productId,
    sku: delta.sku,
    deltaQuantity: delta.deltaQuantity,
    reason: delta.reason,
    saleId: delta.saleId,
    timestamp: delta.timestamp,
    tenantId: delta.tenantId,
  });

  console.log(`[InventoryDeltaReporter] Queued delta for ${delta.sku}: ${delta.deltaQuantity}`);
}

/**
 * Report inventory deltas for a completed sale
 * 
 * This function automatically creates inventory delta events for all items in a sale.
 * 
 * @param saleId - Sale ID
 * @param items - Sale items
 * @param tenantId - Tenant ID
 */
export async function reportSaleInventoryDeltas(
  saleId: string,
  items: Array<{ productId: string; sku: string; quantity: number }>,
  tenantId: string
): Promise<void> {
  const timestamp = Date.now();

  for (const item of items) {
    await reportInventoryDelta({
      productId: item.productId,
      sku: item.sku,
      deltaQuantity: -item.quantity, // Negative for sale (decrement)
      reason: 'sale',
      saleId,
      timestamp,
      tenantId,
    });
  }

  console.log(`[InventoryDeltaReporter] Queued ${items.length} deltas for sale ${saleId}`);
}
