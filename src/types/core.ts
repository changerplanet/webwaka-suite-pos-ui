export interface Permission {
  id: string;
  name: string;
  granted: boolean;
}

export interface Entitlement {
  id: string;
  featureKey: string;
  enabled: boolean;
  limits?: Record<string, number>;
}

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface DashboardSection {
  id: string;
  title: string;
  component: string;
  order: number;
  requiredEntitlement?: string;
  requiredPermission?: string;
  visible: boolean;
  hiddenReason?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  tenantId: string;
  partnerId?: string; // Added for Phase D-3.1: Core session awareness
  permissions: Permission[];
  entitlements: Entitlement[];
  featureFlags: FeatureFlag[];
  dashboardSections: DashboardSection[];
  expiresAt: number;
  coreSessionId?: string; // Added for Phase D-3.1: Core session tracking
  lastSyncedAt?: number; // Added for Phase D-3.1: Last sync timestamp
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  categoryId?: string;
  imageUrl?: string;
  available: boolean;
  stockQuantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export interface Shift {
  id: string;
  userId: string;
  tenantId: string;
  openedAt: number;
  closedAt?: number;
  openingBalance: number;
  closingBalance?: number;
  status: 'open' | 'closed';
  salesCount: number;
  totalSales: number;
}

export interface Sale {
  id: string;
  shiftId: string;
  tenantId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  status: 'pending' | 'completed' | 'voided';
  createdAt: number;
  syncedAt?: number;
}

export interface Receipt {
  id: string;
  saleId: string;
  tenantId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  createdAt: number;
  receiptNumber: string;
}

export interface SyncEvent {
  id: string;
  type: 'sale' | 'shift_open' | 'shift_close' | 'inventory_adjustment';
  payload: Record<string, unknown>;
  createdAt: number;
  syncedAt?: number;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}
