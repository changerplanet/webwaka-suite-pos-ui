'use client';

import { useState, useCallback } from 'react';
import type { Cart, CartItem, Product } from '@/types/core';
import { v4 as uuidv4 } from 'uuid';

const TAX_RATE = 0.1;

export function useCart() {
  const [cart, setCart] = useState<Cart>({
    id: uuidv4(),
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    currency: 'USD',
  });

  const calculateTotals = useCallback((items: CartItem[]): Omit<Cart, 'id' | 'items' | 'currency'> => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, []);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(item => item.productId === product.id);
      
      let newItems: CartItem[];
      
      if (existingIndex >= 0) {
        newItems = prev.items.map((item, index) => {
          if (index === existingIndex) {
            const newQuantity = item.quantity + quantity;
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            };
          }
          return item;
        });
      } else {
        const newItem: CartItem = {
          id: uuidv4(),
          productId: product.id,
          product,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
        };
        newItems = [...prev.items, newItem];
      }

      const totals = calculateTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  }, [calculateTotals]);

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter(item => item.id !== itemId);
      const totals = calculateTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  }, [calculateTotals]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCart((prev) => {
      const newItems = prev.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity,
          };
        }
        return item;
      });
      const totals = calculateTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  }, [calculateTotals, removeItem]);

  const clearCart = useCallback(() => {
    setCart({
      id: uuidv4(),
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      currency: 'USD',
    });
  }, []);

  return { cart, addItem, removeItem, updateQuantity, clearCart };
}
