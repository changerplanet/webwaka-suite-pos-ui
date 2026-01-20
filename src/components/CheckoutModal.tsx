'use client';

import { useState } from 'react';
import type { Cart, Sale } from '@/types/core';

interface CheckoutModalProps {
  cart: Cart;
  onComplete: (paymentMethod: Sale['paymentMethod']) => Promise<void>;
  onCancel: () => void;
}

export function CheckoutModal({ cart, onComplete, onCancel }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [processing, setProcessing] = useState(false);

  const handleComplete = async () => {
    setProcessing(true);
    try {
      await onComplete(paymentMethod);
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods: { value: Sale['paymentMethod']; label: string; icon: string }[] = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'card', label: 'Card', icon: '💳' },
    { value: 'mobile', label: 'Mobile', icon: '📱' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Complete Payment</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="text-gray-400 mb-1">Total Amount</div>
            <div className="text-4xl font-bold text-pos-success">
              ${cart.total.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-400 mb-2">Payment Method</div>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === method.value
                      ? 'border-pos-accent bg-pos-accent/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{method.icon}</div>
                  <div className="text-sm font-medium">{method.label}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Items</span>
              <span>{cart.items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tax</span>
              <span>${cart.tax.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={processing}
            className="flex-1 py-3 rounded-lg bg-pos-success hover:bg-green-400 text-gray-900 font-bold transition-colors disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
