/**
 * Ledger Audit Component
 * 
 * Surfaces ledger event verification and audit trail.
 * 
 * Canon Authority: Phase D-4.3 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * CRITICAL CANON RULES:
 * - This is observability, not control
 * - Append-only verification trail
 * - No event mutation or deletion
 * - Human-readable status only
 * 
 * This component provides VISIBILITY ONLY, not control.
 */

'use client';

import { useState, useEffect } from 'react';
import { getCoreLedgerView, type CoreLedgerEventView } from '@/lib/core-visibility-manager';
import { db } from '@/lib/db';
import type { SyncEvent } from '@/types/core';

interface LedgerAuditEntry {
  eventId: string;
  eventType: string;
  posStatus: 'pending' | 'synced' | 'failed';
  coreStatus: 'received' | 'processing' | 'acknowledged' | 'failed' | 'not_received';
  createdAt: number;
  syncedAt?: number;
  coreReceivedAt?: number;
  coreAcknowledgedAt?: number;
  retryCount: number;
  error?: string;
}

export function LedgerAudit({ tenantId }: { tenantId: string }) {
  const [auditEntries, setAuditEntries] = useState<LedgerAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAuditData();
  }, [tenantId]);

  async function loadAuditData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch POS sync events
      const posEvents = await db.syncEvents.toArray();

      // Fetch Core ledger view
      const coreView = await getCoreLedgerView(tenantId, 100);

      if (!coreView) {
        setError('Unable to fetch Core ledger view. Showing POS events only.');
        setLoading(false);
        return;
      }

      setIsFromCache(coreView.isFromCache);
      setCachedAt(coreView.cachedAt);

      // Build Core event map
      const coreMap = new Map<string, CoreLedgerEventView>();
      for (const event of coreView.events) {
        coreMap.set(event.eventId, event);
      }

      // Build audit entries
      const entries: LedgerAuditEntry[] = posEvents.map((posEvent) => {
        const coreEvent = coreMap.get(posEvent.id);

        return {
          eventId: posEvent.id,
          eventType: posEvent.type,
          posStatus: posEvent.status,
          coreStatus: coreEvent?.status ?? 'not_received',
          createdAt: posEvent.createdAt,
          syncedAt: posEvent.syncedAt,
          coreReceivedAt: coreEvent?.receivedAt,
          coreAcknowledgedAt: coreEvent?.acknowledgedAt,
          retryCount: posEvent.retryCount,
          error: posEvent.error || coreEvent?.error,
        };
      });

      // Sort by creation time (newest first)
      entries.sort((a, b) => b.createdAt - a.createdAt);

      setAuditEntries(entries);
    } catch (err) {
      console.error('[LedgerAudit] Error loading data:', err);
      setError('Failed to load audit data.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(posStatus: string, coreStatus: string) {
    if (posStatus === 'synced' && coreStatus === 'acknowledged') {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">✅ Verified</span>;
    }
    if (posStatus === 'synced' && coreStatus === 'received') {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">🔄 Processing</span>;
    }
    if (posStatus === 'pending') {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">⏳ Pending</span>;
    }
    if (posStatus === 'failed' || coreStatus === 'failed') {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">❌ Failed</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">⚠️ Unknown</span>;
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-600">Loading audit data...</p>
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

  const pendingCount = auditEntries.filter(e => e.posStatus === 'pending').length;
  const failedCount = auditEntries.filter(e => e.posStatus === 'failed' || e.coreStatus === 'failed').length;
  const verifiedCount = auditEntries.filter(e => e.posStatus === 'synced' && e.coreStatus === 'acknowledged').length;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Ledger Audit Trail</h2>
        <p className="text-sm text-gray-600 mt-1">
          Append-only verification of POS events and Core acknowledgments.
        </p>
        {isFromCache && cachedAt && (
          <p className="text-sm text-orange-600 mt-1">
            ⚠️ Showing cached Core view from {new Date(cachedAt).toLocaleString()} (offline or fetch failed)
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-green-700">{verifiedCount}</p>
        </div>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-700">{failedCount}</p>
        </div>
      </div>

      {auditEntries.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <p className="text-gray-600">No ledger events found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retry Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditEntries.map((entry) => (
                <tr key={entry.eventId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">
                    {entry.eventId.substring(0, 12)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.eventType}</td>
                  <td className="px-4 py-3 text-sm">
                    {getStatusBadge(entry.posStatus, entry.coreStatus)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {entry.retryCount > 0 ? (
                      <span className="text-orange-600 font-semibold">{entry.retryCount}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600">
                    {entry.error ? entry.error.substring(0, 50) + '...' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>📌 Canon Rule:</strong> This is an append-only audit trail. Events cannot be modified or deleted.
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={loadAuditData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          🔄 Refresh Audit Trail
        </button>
      </div>
    </div>
  );
}
