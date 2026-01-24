/**
 * Inventory Reconciliation Component
 * 
 * Surfaces inventory discrepancies between POS (authoritative) and Core (replica).
 * 
 * Canon Authority: Phase D-4.2 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * CRITICAL CANON RULES:
 * - POS inventory is ALWAYS authoritative
 * - Core inventory is a read-only replica
 * - Discrepancies are SURFACED, never auto-corrected
 * - No auto-merge, no auto-overwrite
 * 
 * This component provides VISIBILITY ONLY, not control.
 */

'use client';

import { useState, useEffect } from 'react';
import { getCoreInventoryView, type CoreInventoryView } from '@/lib/core-visibility-manager';
import { db } from '@/lib/db';
import type { Product } from '@/types/core';

interface InventoryDiscrepancy {
  productId: string;
  sku: string;
  name: string;
  posQuantity: number; // Authoritative
  coreQuantity: number; // Replica
  delta: number; // Difference (POS - Core)
  lastSyncedAt: number | null;
}

export function InventoryReconciliation({ tenantId }: { tenantId: string }) {
  const [discrepancies, setDiscrepancies] = useState<InventoryDiscrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReconciliationData();
  }, [tenantId]);

  async function loadReconciliationData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch POS inventory (authoritative)
      const posProducts = await db.products.toArray();

      // Fetch Core inventory view (replica)
      const coreView = await getCoreInventoryView(tenantId);

      if (!coreView) {
        setError('Unable to fetch Core inventory view. Showing POS inventory only.');
        setLoading(false);
        return;
      }

      setIsFromCache(coreView.isFromCache);
      setCachedAt(coreView.cachedAt);

      // Build reconciliation map
      const coreMap = new Map<string, CoreInventoryView>();
      for (const item of coreView.inventory) {
        coreMap.set(item.productId, item);
      }

      // Calculate discrepancies
      const discrepancyList: InventoryDiscrepancy[] = [];

      for (const product of posProducts) {
        const coreItem = coreMap.get(product.id);
        const coreQuantity = coreItem?.quantity ?? 0;
        const delta = product.stock - coreQuantity;

        if (delta !== 0) {
          discrepancyList.push({
            productId: product.id,
            sku: product.sku,
            name: product.name,
            posQuantity: product.stock,
            coreQuantity,
            delta,
            lastSyncedAt: coreItem?.lastSyncedAt ?? null,
          });
        }
      }

      setDiscrepancies(discrepancyList);
    } catch (err) {
      console.error('[InventoryReconciliation] Error loading data:', err);
      setError('Failed to load reconciliation data.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-600">Loading reconciliation data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 font-semibold">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Inventory Reconciliation</h2>
        <p className="text-sm text-gray-600 mt-1">
          POS inventory is <strong>authoritative</strong>. Core view is a read-only replica.
        </p>
        {isFromCache && cachedAt && (
          <p className="text-sm text-orange-600 mt-1">
            ⚠️ Showing cached Core view from {new Date(cachedAt).toLocaleString()} (offline or fetch failed)
          </p>
        )}
      </div>

      {discrepancies.length === 0 ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">✅ No discrepancies found. POS and Core are aligned.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  POS Inventory<br /><span className="text-green-600 font-semibold">(Authoritative)</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Core View<br /><span className="text-gray-400">(Read-Only Replica)</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Δ Difference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Synced
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discrepancies.map((item) => (
                <tr key={item.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.name}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700">{item.posQuantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.coreQuantity}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${item.delta > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {item.delta > 0 ? '+' : ''}{item.delta}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {item.lastSyncedAt ? new Date(item.lastSyncedAt).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>📌 Canon Rule:</strong> POS inventory ALWAYS wins. Discrepancies are surfaced for human review, never auto-corrected.
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={loadReconciliationData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          🔄 Refresh Reconciliation
        </button>
      </div>
    </div>
  );
}
