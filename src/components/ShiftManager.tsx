'use client';

import { useState } from 'react';
import type { Shift } from '@/types/core';

interface ShiftManagerProps {
  currentShift: Shift | null;
  loading: boolean;
  onOpenShift: (openingBalance: number) => Promise<Shift | null>;
  onCloseShift: (closingBalance: number) => Promise<Shift | null>;
}

export function ShiftManager({ currentShift, loading, onOpenShift, onCloseShift }: ShiftManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [balance, setBalance] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleAction = async () => {
    setProcessing(true);
    const balanceNum = parseFloat(balance) || 0;
    
    try {
      if (currentShift) {
        await onCloseShift(balanceNum);
      } else {
        await onOpenShift(balanceNum);
      }
      setShowModal(false);
      setBalance('');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/40 rounded-xl border border-gray-700 p-4">
        <div className="animate-pulse h-20 bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800/40 rounded-xl border border-gray-700 p-4">
        {currentShift ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Current Shift</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">Open</span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
              >
                Close Shift
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-pos-accent">{currentShift.salesCount}</div>
                <div className="text-xs text-gray-400">Sales</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-pos-success">${currentShift.totalSales.toFixed(0)}</div>
                <div className="text-xs text-gray-400">Revenue</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-2xl font-bold">${currentShift.openingBalance.toFixed(0)}</div>
                <div className="text-xs text-gray-400">Opening</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 mb-3">No active shift</div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-pos-accent hover:bg-cyan-400 text-gray-900 rounded-lg font-medium transition-colors"
            >
              Open Shift
            </button>
          </div>
        )}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl w-full max-w-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                {currentShift ? 'Close Shift' : 'Open Shift'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {currentShift ? 'Closing Balance' : 'Opening Balance'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-pos-accent"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setBalance('');
                }}
                disabled={processing}
                className="flex-1 py-3 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className={`flex-1 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 ${
                  currentShift 
                    ? 'bg-red-600 hover:bg-red-500 text-white' 
                    : 'bg-pos-accent hover:bg-cyan-400 text-gray-900'
                }`}
              >
                {processing ? 'Processing...' : (currentShift ? 'Close' : 'Open')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
