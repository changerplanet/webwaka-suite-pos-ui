'use client';

import type { Cart } from '@/types/core';

interface CartViewProps {
  cart: Cart;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartView({ cart, onUpdateQuantity, onRemoveItem, onClear, onCheckout }: CartViewProps) {
  const hasItems = cart.items.length > 0;

  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cart</h2>
        {hasItems && (
          <button
            onClick={onClear}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!hasItems ? (
          <div className="text-center text-gray-500 py-8">
            Cart is empty
          </div>
        ) : (
          cart.items.map((item) => (
            <div key={item.id} className="bg-gray-900/50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm line-clamp-1">{item.product.name}</div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-gray-500 hover:text-red-400 text-xs"
                >
                  Remove
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="text-pos-accent font-semibold">
                  ${item.totalPrice.toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {hasItems && (
        <div className="p-4 border-t border-gray-700 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tax (10%)</span>
              <span>${cart.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
              <span>Total</span>
              <span className="text-pos-success">${cart.total.toFixed(2)}</span>
            </div>
          </div>
          
          <button
            onClick={onCheckout}
            className="w-full bg-pos-success hover:bg-green-400 text-gray-900 font-bold py-3 rounded-lg transition-colors"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
