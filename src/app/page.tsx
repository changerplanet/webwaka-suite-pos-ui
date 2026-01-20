'use client';

import { useState, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { useCart } from '@/hooks/useCart';
import { useShift } from '@/hooks/useShift';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync-manager';
import type { Product, Sale, Receipt } from '@/types/core';
import { v4 as uuidv4 } from 'uuid';

import { LoginForm } from '@/components/LoginForm';
import { SyncIndicator } from '@/components/SyncIndicator';
import { ProductGrid } from '@/components/ProductGrid';
import { CartView } from '@/components/CartView';
import { CheckoutModal } from '@/components/CheckoutModal';
import { ReceiptView } from '@/components/ReceiptView';
import { ShiftManager } from '@/components/ShiftManager';

export default function POSPage() {
  const { session, loading: sessionLoading, login, logout } = useSession();
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const { currentShift, loading: shiftLoading, openShift, closeShift, updateShiftSales } = useShift(session);
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const [activeTab, setActiveTab] = useState<'pos' | 'shift'>('pos');

  const handleSelectProduct = useCallback((product: Product) => {
    addItem(product, 1);
  }, [addItem]);

  const handleCheckout = useCallback(() => {
    if (cart.items.length > 0 && currentShift) {
      setShowCheckout(true);
    }
  }, [cart.items.length, currentShift]);

  const handleCompleteCheckout = useCallback(async (paymentMethod: Sale['paymentMethod']) => {
    if (!session || !currentShift) return;

    const sale: Sale = {
      id: uuidv4(),
      shiftId: currentShift.id,
      tenantId: session.tenantId,
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      paymentMethod,
      status: 'pending',
      createdAt: Date.now(),
    };

    await db.sales.add(sale);
    await syncManager.queueEvent('sale', { saleId: sale.id, ...sale });
    await updateShiftSales(sale.total);

    const receipt: Receipt = {
      id: uuidv4(),
      saleId: sale.id,
      tenantId: session.tenantId,
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      paymentMethod,
      createdAt: Date.now(),
      receiptNumber: `RCP-${Date.now().toString(36).toUpperCase()}`,
    };

    await db.receipts.add(receipt);

    setLastReceipt(receipt);
    setShowCheckout(false);
    clearCart();
  }, [session, currentShift, cart, clearCart, updateShiftSales]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pos-accent" />
      </div>
    );
  }

  if (!session) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900/80 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gradient">WebWaka POS</h1>
            <SyncIndicator />
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {session.username}
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <nav className="bg-gray-900/50 border-b border-gray-800 px-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pos' 
                ? 'border-pos-accent text-pos-accent' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Point of Sale
          </button>
          <button
            onClick={() => setActiveTab('shift')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'shift' 
                ? 'border-pos-accent text-pos-accent' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Shift
          </button>
        </div>
      </nav>
      
      <main className="flex-1 p-4">
        {activeTab === 'pos' ? (
          !currentShift ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-4">Please open a shift to start selling</div>
                <button
                  onClick={() => setActiveTab('shift')}
                  className="px-6 py-3 bg-pos-accent hover:bg-cyan-400 text-gray-900 rounded-lg font-medium"
                >
                  Open Shift
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              <div className="lg:col-span-2">
                <ProductGrid onSelectProduct={handleSelectProduct} />
              </div>
              <div className="h-[calc(100vh-200px)]">
                <CartView
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeItem}
                  onClear={clearCart}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          )
        ) : (
          <div className="max-w-md mx-auto">
            <ShiftManager
              currentShift={currentShift}
              loading={shiftLoading}
              onOpenShift={openShift}
              onCloseShift={closeShift}
            />
          </div>
        )}
      </main>
      
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onComplete={handleCompleteCheckout}
          onCancel={() => setShowCheckout(false)}
        />
      )}
      
      {lastReceipt && (
        <ReceiptView
          receipt={lastReceipt}
          onClose={() => setLastReceipt(null)}
        />
      )}
    </div>
  );
}
