'use client';

import type { Receipt } from '@/types/core';

interface ReceiptViewProps {
  receipt: Receipt;
  onClose: () => void;
}

export function ReceiptView({ receipt, onClose }: ReceiptViewProps) {
  const formattedDate = new Date(receipt.createdAt).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-gray-900 rounded-lg w-full max-w-sm">
        <div className="p-6 text-center border-b border-gray-200">
          <h2 className="text-xl font-bold">WebWaka POS</h2>
          <div className="text-sm text-gray-500 mt-1">Receipt</div>
        </div>
        
        <div className="p-4 border-b border-dashed border-gray-300">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Receipt #: {receipt.receiptNumber}</div>
            <div>Date: {formattedDate}</div>
            <div>Payment: {receipt.paymentMethod.toUpperCase()}</div>
          </div>
        </div>
        
        <div className="p-4 border-b border-dashed border-gray-300">
          {receipt.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <div>
                <span>{item.quantity}x </span>
                <span>{item.product.name}</span>
              </div>
              <div>${item.totalPrice.toFixed(2)}</div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-b border-gray-200 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${receipt.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${receipt.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2">
            <span>Total</span>
            <span>${receipt.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="p-4 text-center text-sm text-gray-500">
          Thank you for your purchase!
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
