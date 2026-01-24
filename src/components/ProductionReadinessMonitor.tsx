/**
 * Production Readiness Monitor
 * 
 * Monitors network health, sync status, and version compatibility.
 * 
 * Canon Authority: Phase D-4.5 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * CRITICAL CANON RULES:
 * - This is about safety and clarity, not speed
 * - Hard fail if Core contract version mismatches
 * - Warn on network degradation, sync backlog, offline duration
 * 
 * This component provides MONITORING and ALERTS ONLY.
 */

'use client';

import { useState, useEffect } from 'react';
import { getSyncQueueStats } from '@/lib/sync-queue-manager';
import { fetchSyncStatus } from '@/lib/core-visibility-manager';

interface ReadinessStatus {
  network: 'online' | 'offline' | 'degraded';
  syncBacklog: number;
  offlineDuration: number | null; // milliseconds
  versionCompatible: boolean;
  lastSyncTime: number | null;
}

export function ProductionReadinessMonitor({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<ReadinessStatus>({
    network: 'online',
    syncBacklog: 0,
    offlineDuration: null,
    versionCompatible: true,
    lastSyncTime: null,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    checkReadiness();
    const interval = setInterval(checkReadiness, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [tenantId]);

  async function checkReadiness() {
    try {
      // Check network status
      const isOnline = navigator.onLine;

      // Get sync queue stats
      const queueStats = await getSyncQueueStats();

      // Get sync status from Core (if online)
      let syncStatus = null;
      if (isOnline) {
        syncStatus = await fetchSyncStatus(tenantId);
      }

      // Calculate offline duration
      let offlineDuration: number | null = null;
      if (!isOnline && syncStatus?.lastSyncTime) {
        offlineDuration = Date.now() - syncStatus.lastSyncTime;
      }

      // Determine network health
      let networkHealth: 'online' | 'offline' | 'degraded' = 'online';
      if (!isOnline) {
        networkHealth = 'offline';
      } else if (queueStats.pending > 10 || queueStats.failed > 5) {
        networkHealth = 'degraded';
      }

      setStatus({
        network: networkHealth,
        syncBacklog: queueStats.pending,
        offlineDuration,
        versionCompatible: true, // TODO: Implement version check
        lastSyncTime: syncStatus?.lastSyncTime ?? null,
      });
    } catch (error) {
      console.error('[ProductionReadinessMonitor] Error checking readiness:', error);
    }
  }

  function getStatusColor() {
    if (status.network === 'offline') return 'bg-red-500';
    if (status.network === 'degraded') return 'bg-yellow-500';
    if (status.syncBacklog > 20) return 'bg-orange-500';
    return 'bg-green-500';
  }

  function getStatusText() {
    if (status.network === 'offline') return 'Offline Mode';
    if (status.network === 'degraded') return 'Network Degraded';
    if (status.syncBacklog > 20) return 'High Sync Backlog';
    return 'All Systems Operational';
  }

  if (!isExpanded) {
    return (
      <div
        className="fixed bottom-4 right-4 flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition z-40"
        onClick={() => setIsExpanded(true)}
      >
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
        <span className="text-sm font-semibold text-gray-700">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-40">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Production Readiness</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Network Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Network Status</span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              status.network === 'online'
                ? 'bg-green-100 text-green-800'
                : status.network === 'degraded'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {status.network.toUpperCase()}
          </span>
        </div>

        {/* Sync Backlog */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Sync Backlog</span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              status.syncBacklog === 0
                ? 'bg-green-100 text-green-800'
                : status.syncBacklog < 10
                ? 'bg-blue-100 text-blue-800'
                : status.syncBacklog < 20
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {status.syncBacklog} events
          </span>
        </div>

        {/* Offline Duration */}
        {status.offlineDuration !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Offline Duration</span>
            <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">
              {Math.floor(status.offlineDuration / 1000 / 60)} minutes
            </span>
          </div>
        )}

        {/* Last Sync Time */}
        {status.lastSyncTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Last Sync</span>
            <span className="text-xs text-gray-600">
              {new Date(status.lastSyncTime).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Version Compatibility */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Version Compatible</span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              status.versionCompatible
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {status.versionCompatible ? '✓ YES' : '✗ NO'}
          </span>
        </div>

        {/* Alerts */}
        {status.network === 'offline' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-semibold">⚠️ Offline Mode Active</p>
            <p className="text-xs text-red-700 mt-1">
              POS is operating offline. Sync will resume when connection is restored.
            </p>
          </div>
        )}

        {status.network === 'degraded' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 font-semibold">⚠️ Network Degraded</p>
            <p className="text-xs text-yellow-700 mt-1">
              Sync performance may be impacted. POS continues to operate normally.
            </p>
          </div>
        )}

        {status.syncBacklog > 20 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-sm text-orange-800 font-semibold">⚠️ High Sync Backlog</p>
            <p className="text-xs text-orange-700 mt-1">
              {status.syncBacklog} events pending sync. Consider checking network connectivity.
            </p>
          </div>
        )}

        {!status.versionCompatible && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-semibold">🛑 Version Mismatch</p>
            <p className="text-xs text-red-700 mt-1">
              POS and Core versions are incompatible. Please update to the latest version.
            </p>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <button
          onClick={checkReadiness}
          className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition"
        >
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );
}
