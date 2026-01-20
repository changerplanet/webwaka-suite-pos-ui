import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/LoginForm';
import { CartView } from '@/components/CartView';
import { SyncIndicator } from '@/components/SyncIndicator';
import { ProductGrid } from '@/components/ProductGrid';
import { DashboardRenderer } from '@/components/DashboardRenderer';
import type { Cart, UserSession } from '@/types/core';

jest.mock('@/hooks/useSync', () => ({
  useSync: () => ({
    status: 'online',
    pendingCount: 0,
    failedCount: 0,
    forceSync: jest.fn(),
  }),
}));

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    products: [
      { id: 'p1', name: 'Coffee', price: 3.50, sku: 'SKU1', available: true, stockQuantity: 10 },
      { id: 'p2', name: 'Tea', price: 2.50, sku: 'SKU2', available: true, stockQuantity: 5 },
    ],
    loading: false,
    searchProducts: jest.fn(),
    searchTerm: '',
    getProduct: jest.fn(),
  }),
}));

describe('LoginForm Component', () => {
  it('renders login form with all fields', () => {
    const mockLogin = jest.fn().mockResolvedValue(true);
    render(<LoginForm onLogin={mockLogin} />);
    
    expect(screen.getByText('WebWaka POS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('disables submit button when fields are empty', () => {
    const mockLogin = jest.fn();
    render(<LoginForm onLogin={mockLogin} />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when fields are filled', () => {
    const mockLogin = jest.fn();
    render(<LoginForm onLogin={mockLogin} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'password' } });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).not.toBeDisabled();
  });
});

describe('CartView Component', () => {
  const emptyCart: Cart = {
    id: 'cart_1',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    currency: 'USD',
  };

  const cartWithItems: Cart = {
    id: 'cart_2',
    items: [
      {
        id: 'item_1',
        productId: 'prod_1',
        product: { id: 'prod_1', sku: 'SKU1', name: 'Coffee', price: 3.50, currency: 'USD', available: true, stockQuantity: 10 },
        quantity: 2,
        unitPrice: 3.50,
        totalPrice: 7.00,
      },
    ],
    subtotal: 7.00,
    tax: 0.70,
    total: 7.70,
    currency: 'USD',
  };

  it('renders empty cart message', () => {
    render(
      <CartView
        cart={emptyCart}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onClear={jest.fn()}
        onCheckout={jest.fn()}
      />
    );
    
    expect(screen.getByText('Cart is empty')).toBeInTheDocument();
  });

  it('renders cart items when present', () => {
    render(
      <CartView
        cart={cartWithItems}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onClear={jest.fn()}
        onCheckout={jest.fn()}
      />
    );
    
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('$7.00').length).toBeGreaterThan(0);
  });

  it('shows checkout button when cart has items', () => {
    render(
      <CartView
        cart={cartWithItems}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onClear={jest.fn()}
        onCheckout={jest.fn()}
      />
    );
    
    expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument();
  });

  it('does not show checkout button when cart is empty', () => {
    render(
      <CartView
        cart={emptyCart}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onClear={jest.fn()}
        onCheckout={jest.fn()}
      />
    );
    
    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument();
  });
});

describe('SyncIndicator Component', () => {
  it('renders sync status', () => {
    render(<SyncIndicator />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});

describe('ProductGrid Component', () => {
  it('renders product list', () => {
    const mockSelect = jest.fn();
    render(<ProductGrid onSelectProduct={mockSelect} />);
    
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });

  it('renders search input', () => {
    const mockSelect = jest.fn();
    render(<ProductGrid onSelectProduct={mockSelect} />);
    
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('calls onSelectProduct when product is clicked', () => {
    const mockSelect = jest.fn();
    render(<ProductGrid onSelectProduct={mockSelect} />);
    
    fireEvent.click(screen.getByText('Coffee'));
    expect(mockSelect).toHaveBeenCalled();
  });
});

describe('DashboardRenderer Component', () => {
  const mockSession: UserSession = {
    id: 'session_1',
    userId: 'user_1',
    username: 'testuser',
    tenantId: 'tenant_1',
    permissions: [{ id: 'p1', name: 'pos.shift.manage', granted: true }],
    entitlements: [{ id: 'e1', featureKey: 'pos.basic', enabled: true }],
    featureFlags: [{ id: 'f1', key: 'offline_mode', enabled: true }],
    dashboardSections: [
      { id: 'ds1', title: 'Quick Sale', component: 'QuickSale', order: 1, visible: true },
      { id: 'ds2', title: 'Reports', component: 'Reports', order: 2, visible: true, requiredEntitlement: 'reports.premium' },
    ],
    expiresAt: Date.now() + 3600000,
  };

  it('renders visible dashboard sections', () => {
    render(<DashboardRenderer session={mockSession} />);
    expect(screen.getByText('Quick Sale')).toBeInTheDocument();
  });

  it('does not render sections when missing required entitlement', () => {
    render(<DashboardRenderer session={mockSession} />);
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
  });

  it('shows hidden reason in dev mode', () => {
    render(<DashboardRenderer session={mockSession} devMode={true} />);
    expect(screen.getByText(/Missing entitlement: reports.premium/)).toBeInTheDocument();
  });
});
