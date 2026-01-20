import type { 
  Permission, 
  Entitlement, 
  FeatureFlag, 
  DashboardSection,
  UserSession 
} from '@/types/core';

const MOCK_PERMISSIONS: Permission[] = [
  { id: 'perm_sales', name: 'pos.sales.create', granted: true },
  { id: 'perm_refunds', name: 'pos.refunds.create', granted: true },
  { id: 'perm_shift', name: 'pos.shift.manage', granted: true },
  { id: 'perm_reports', name: 'pos.reports.view', granted: true },
  { id: 'perm_inventory', name: 'pos.inventory.view', granted: true },
];

const MOCK_ENTITLEMENTS: Entitlement[] = [
  { id: 'ent_pos_basic', featureKey: 'pos.basic', enabled: true },
  { id: 'ent_pos_advanced', featureKey: 'pos.advanced', enabled: true },
  { id: 'ent_inventory', featureKey: 'inventory.management', enabled: true },
  { id: 'ent_reports', featureKey: 'reports.basic', enabled: true },
];

const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'ff_offline', key: 'offline_mode', enabled: true },
  { id: 'ff_receipts', key: 'digital_receipts', enabled: true },
  { id: 'ff_quick_sale', key: 'quick_sale_mode', enabled: true },
];

const MOCK_DASHBOARD_SECTIONS: DashboardSection[] = [
  { id: 'ds_sales', title: 'Quick Sale', component: 'QuickSale', order: 1, visible: true },
  { id: 'ds_cart', title: 'Cart', component: 'Cart', order: 2, visible: true },
  { id: 'ds_products', title: 'Products', component: 'ProductGrid', order: 3, visible: true },
  { id: 'ds_shift', title: 'Shift Management', component: 'ShiftManager', order: 4, requiredPermission: 'pos.shift.manage', visible: true },
  { id: 'ds_reports', title: 'Reports', component: 'Reports', order: 5, requiredEntitlement: 'reports.basic', visible: true, hiddenReason: 'Requires reports entitlement' },
];

export function resolvePermissions(session: UserSession | null): Permission[] {
  if (!session) return [];
  return session.permissions.filter(p => p.granted);
}

export function resolveEntitlements(session: UserSession | null): Entitlement[] {
  if (!session) return [];
  return session.entitlements.filter(e => e.enabled);
}

export function resolveFeatureFlags(session: UserSession | null): FeatureFlag[] {
  if (!session) return [];
  return session.featureFlags.filter(f => f.enabled);
}

export function resolveDashboardSections(session: UserSession | null): DashboardSection[] {
  if (!session) return [];
  
  const permissions = resolvePermissions(session);
  const entitlements = resolveEntitlements(session);
  
  return session.dashboardSections.map(section => {
    let visible = true;
    let hiddenReason: string | undefined;

    if (section.requiredPermission) {
      const hasPermission = permissions.some(p => p.name === section.requiredPermission);
      if (!hasPermission) {
        visible = false;
        hiddenReason = `Missing permission: ${section.requiredPermission}`;
      }
    }

    if (section.requiredEntitlement && visible) {
      const hasEntitlement = entitlements.some(e => e.featureKey === section.requiredEntitlement);
      if (!hasEntitlement) {
        visible = false;
        hiddenReason = `Missing entitlement: ${section.requiredEntitlement}`;
      }
    }

    return { ...section, visible, hiddenReason };
  });
}

export function hasPermission(session: UserSession | null, permissionName: string): boolean {
  if (!session) return false;
  return session.permissions.some(p => p.name === permissionName && p.granted);
}

export function hasEntitlement(session: UserSession | null, featureKey: string): boolean {
  if (!session) return false;
  return session.entitlements.some(e => e.featureKey === featureKey && e.enabled);
}

export function isFeatureEnabled(session: UserSession | null, flagKey: string): boolean {
  if (!session) return false;
  return session.featureFlags.some(f => f.key === flagKey && f.enabled);
}

export function createMockSession(username: string): UserSession {
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id: `session_${uniqueId}`,
    userId: `user_${username}`,
    username,
    tenantId: 'tenant_demo',
    permissions: MOCK_PERMISSIONS,
    entitlements: MOCK_ENTITLEMENTS,
    featureFlags: MOCK_FEATURE_FLAGS,
    dashboardSections: MOCK_DASHBOARD_SECTIONS,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  };
}
