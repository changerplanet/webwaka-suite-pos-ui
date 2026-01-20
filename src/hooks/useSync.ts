'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager, type SyncStatus } from '@/lib/sync-manager';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>('offline');
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    setStatus(syncManager.getStatus());
    
    const unsubscribe = syncManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    const updateCounts = async () => {
      const counts = await syncManager.getEventCount();
      setPendingCount(counts.pending);
      setFailedCount(counts.failed);
    };

    updateCounts();
    const interval = setInterval(updateCounts, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const forceSync = useCallback(async () => {
    await syncManager.forceSync();
    const counts = await syncManager.getEventCount();
    setPendingCount(counts.pending);
    setFailedCount(counts.failed);
  }, []);

  return { status, pendingCount, failedCount, forceSync };
}
