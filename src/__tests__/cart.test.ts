import { renderHook, act } from '@testing-library/react';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types/core';

const mockProduct: Product = {
  id: 'prod_1',
  sku: 'SKU001',
  name: 'Test Coffee',
  price: 3.50,
  currency: 'USD',
  available: true,
  stockQuantity: 100,
};

const mockProduct2: Product = {
  id: 'prod_2',
  sku: 'SKU002',
  name: 'Test Tea',
  price: 2.50,
  currency: 'USD',
  available: true,
  stockQuantity: 50,
};

describe('useCart Hook', () => {
  describe('initial state', () => {
    it('starts with empty cart', () => {
      const { result } = renderHook(() => useCart());
      
      expect(result.current.cart.items).toHaveLength(0);
      expect(result.current.cart.subtotal).toBe(0);
      expect(result.current.cart.tax).toBe(0);
      expect(result.current.cart.total).toBe(0);
    });

    it('has a valid cart id', () => {
      const { result } = renderHook(() => useCart());
      expect(result.current.cart.id).toBeDefined();
    });
  });

  describe('addItem', () => {
    it('adds a product to cart', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct);
      });
      
      expect(result.current.cart.items).toHaveLength(1);
      expect(result.current.cart.items[0].productId).toBe('prod_1');
      expect(result.current.cart.items[0].quantity).toBe(1);
    });

    it('calculates correct totals after adding item', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct);
      });
      
      expect(result.current.cart.subtotal).toBe(3.50);
      expect(result.current.cart.tax).toBeCloseTo(0.35, 2);
      expect(result.current.cart.total).toBeCloseTo(3.85, 2);
    });

    it('increases quantity when adding same product', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct);
        result.current.addItem(mockProduct);
      });
      
      expect(result.current.cart.items).toHaveLength(1);
      expect(result.current.cart.items[0].quantity).toBe(2);
      expect(result.current.cart.items[0].totalPrice).toBe(7.00);
    });

    it('adds multiple different products', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct);
        result.current.addItem(mockProduct2);
      });
      
      expect(result.current.cart.items).toHaveLength(2);
      expect(result.current.cart.subtotal).toBe(6.00);
    });

    it('supports adding with custom quantity', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct, 5);
      });
      
      expect(result.current.cart.items[0].quantity).toBe(5);
      expect(result.current.cart.items[0].totalPrice).toBe(17.50);
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct);
      });
      
      const itemId = result.current.cart.items[0].id;
      
      act(() => {
        result.current.removeItem(itemId);
      });
      
      expect(result.current.cart.items).toHaveLength(0);
      expect(result.current.cart.subtotal).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct);
      });
      
      const itemId = result.current.cart.items[0].id;
      
      act(() => {
        result.current.updateQuantity(itemId, 3);
      });
      
      expect(result.current.cart.items[0].quantity).toBe(3);
      expect(result.current.cart.items[0].totalPrice).toBe(10.50);
    });

    it('removes item when quantity is zero or less', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct);
      });
      
      const itemId = result.current.cart.items[0].id;
      
      act(() => {
        result.current.updateQuantity(itemId, 0);
      });
      
      expect(result.current.cart.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('clears all items from cart', () => {
      const { result } = renderHook(() => useCart());
      
      act(() => {
        result.current.addItem(mockProduct);
        result.current.addItem(mockProduct2);
      });
      
      expect(result.current.cart.items).toHaveLength(2);
      
      act(() => {
        result.current.clearCart();
      });
      
      expect(result.current.cart.items).toHaveLength(0);
      expect(result.current.cart.subtotal).toBe(0);
      expect(result.current.cart.tax).toBe(0);
      expect(result.current.cart.total).toBe(0);
    });

    it('generates new cart id after clearing', () => {
      const { result } = renderHook(() => useCart());
      
      const originalId = result.current.cart.id;
      
      act(() => {
        result.current.clearCart();
      });
      
      expect(result.current.cart.id).not.toBe(originalId);
    });
  });
});
