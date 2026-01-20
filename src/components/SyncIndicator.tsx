'use client';

import { useSync } from '@/hooks/useSync';

export function SyncIndicator() {
  const { status, pendingCount, failedCount, forceSync } = useSync();

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    syncing: 'bg-yellow-500 animate-pulse',
  };

  const statusLabels = {
    online: 'Online',
    offline: 'Offline',
    syncing: 'Syncing...',
  };

  return (
    <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
        <span className="text-sm font-medium">{statusLabels[status]}</span>
      </div>
      
      {pendingCount > 0 && (
        <span className="text-xs text-yellow-400">
          {pendingCount} pending
        </span>
      )}
      
      {failedCount > 0 && (
        <span className="text-xs text-red-400">
          {failedCount} failed
        </span>
      )}
      
      {status === 'offline' && pendingCount > 0 && (
        <button
          onClick={forceSync}
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
