'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { Product } from '@/types/core';

const MOCK_PRODUCTS: Product[] = [
  { id: 'prod_1', sku: 'SKU001', name: 'Coffee - Regular', price: 3.50, currency: 'USD', available: true, stockQuantity: 100 },
  { id: 'prod_2', sku: 'SKU002', name: 'Coffee - Large', price: 4.50, currency: 'USD', available: true, stockQuantity: 80 },
  { id: 'prod_3', sku: 'SKU003', name: 'Tea - Green', price: 2.50, currency: 'USD', available: true, stockQuantity: 60 },
  { id: 'prod_4', sku: 'SKU004', name: 'Tea - Black', price: 2.50, currency: 'USD', available: true, stockQuantity: 55 },
  { id: 'prod_5', sku: 'SKU005', name: 'Croissant', price: 3.00, currency: 'USD', available: true, stockQuantity: 25 },
  { id: 'prod_6', sku: 'SKU006', name: 'Muffin - Blueberry', price: 3.50, currency: 'USD', available: true, stockQuantity: 20 },
  { id: 'prod_7', sku: 'SKU007', name: 'Sandwich - Turkey', price: 7.50, currency: 'USD', available: true, stockQuantity: 15 },
  { id: 'prod_8', sku: 'SKU008', name: 'Sandwich - Veggie', price: 6.50, currency: 'USD', available: true, stockQuantity: 12 },
  { id: 'prod_9', sku: 'SKU009', name: 'Cookie - Chocolate', price: 2.00, currency: 'USD', available: true, stockQuantity: 40 },
  { id: 'prod_10', sku: 'SKU010', name: 'Water - Bottle', price: 1.50, currency: 'USD', available: true, stockQuantity: 200 },
  { id: 'prod_11', sku: 'SKU011', name: 'Juice - Orange', price: 4.00, currency: 'USD', available: true, stockQuantity: 30 },
  { id: 'prod_12', sku: 'SKU012', name: 'Salad - Caesar', price: 8.50, currency: 'USD', available: true, stockQuantity: 10 },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    initializeProducts();
  }, []);

  const initializeProducts = async () => {
    try {
      const existingProducts = await db.products.count();
      
      if (existingProducts === 0) {
        await db.products.bulkAdd(MOCK_PRODUCTS);
      }
      
      const allProducts = await db.products.toArray();
      setProducts(allProducts);
    } catch {
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.available && (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const searchProducts = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const getProduct = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  return { products: filteredProducts, allProducts: products, loading, searchProducts, searchTerm, getProduct };
}
