'use client';

import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/core';

interface ProductGridProps {
  onSelectProduct: (product: Product) => void;
}

export function ProductGrid({ onSelectProduct }: ProductGridProps) {
  const { products, loading, searchProducts, searchTerm } = useProducts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pos-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => searchProducts(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pos-accent"
      />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 hover:border-pos-accent rounded-xl p-4 text-left transition-all duration-200"
          >
            <div className="font-medium text-white mb-1 line-clamp-2">
              {product.name}
            </div>
            <div className="text-pos-accent font-bold">
              ${product.price.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Stock: {product.stockQuantity}
            </div>
          </button>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No products found
        </div>
      )}
    </div>
  );
}
