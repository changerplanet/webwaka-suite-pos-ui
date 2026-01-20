'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync-manager';
import type { Shift, UserSession } from '@/types/core';
import { v4 as uuidv4 } from 'uuid';

export function useShift(session: UserSession | null) {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      loadCurrentShift();
    } else {
      setCurrentShift(null);
      setLoading(false);
    }
  }, [session]);

  const loadCurrentShift = async () => {
    if (!session) return;
    
    try {
      const shifts = await db.shifts
        .where('userId')
        .equals(session.userId)
        .filter(s => s.status === 'open')
        .toArray();
      
      setCurrentShift(shifts[0] || null);
    } catch {
      setCurrentShift(null);
    } finally {
      setLoading(false);
    }
  };

  const openShift = useCallback(async (openingBalance: number): Promise<Shift | null> => {
    if (!session) return null;

    const shift: Shift = {
      id: uuidv4(),
      userId: session.userId,
      tenantId: session.tenantId,
      openedAt: Date.now(),
      openingBalance,
      status: 'open',
      salesCount: 0,
      totalSales: 0,
    };

    await db.shifts.add(shift);
    await syncManager.queueEvent('shift_open', { shiftId: shift.id, ...shift });
    
    setCurrentShift(shift);
    return shift;
  }, [session]);

  const closeShift = useCallback(async (closingBalance: number): Promise<Shift | null> => {
    if (!currentShift) return null;

    const closedShift: Shift = {
      ...currentShift,
      closedAt: Date.now(),
      closingBalance,
      status: 'closed',
    };

    await db.shifts.update(currentShift.id, {
      closedAt: closedShift.closedAt,
      closingBalance,
      status: 'closed',
    });
    
    await syncManager.queueEvent('shift_close', { 
      shiftId: closedShift.id, 
      closedAt: closedShift.closedAt,
      closingBalance,
    });
    
    setCurrentShift(null);
    return closedShift;
  }, [currentShift]);

  const updateShiftSales = useCallback(async (saleTotal: number) => {
    if (!currentShift) return;
    
    await db.shifts.update(currentShift.id, {
      salesCount: currentShift.salesCount + 1,
      totalSales: currentShift.totalSales + saleTotal,
    });

    setCurrentShift(prev => prev ? {
      ...prev,
      salesCount: prev.salesCount + 1,
      totalSales: prev.totalSales + saleTotal,
    } : null);
  }, [currentShift]);

  return { currentShift, loading, openShift, closeShift, updateShiftSales };
}
