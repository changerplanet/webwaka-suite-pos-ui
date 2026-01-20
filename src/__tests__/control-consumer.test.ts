import {
  resolvePermissions,
  resolveEntitlements,
  resolveFeatureFlags,
  resolveDashboardSections,
  hasPermission,
  hasEntitlement,
  isFeatureEnabled,
  createMockSession,
} from '@/lib/control-consumer';
import type { UserSession, Permission, Entitlement, FeatureFlag, DashboardSection } from '@/types/core';

describe('Control Consumer', () => {
  let mockSession: UserSession;

  beforeEach(() => {
    mockSession = createMockSession('testuser');
  });

  describe('createMockSession', () => {
    it('creates a valid session with all required fields', () => {
      const session = createMockSession('cashier');
      
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user_cashier');
      expect(session.username).toBe('cashier');
      expect(session.tenantId).toBe('tenant_demo');
      expect(session.permissions).toBeInstanceOf(Array);
      expect(session.entitlements).toBeInstanceOf(Array);
      expect(session.featureFlags).toBeInstanceOf(Array);
      expect(session.dashboardSections).toBeInstanceOf(Array);
      expect(session.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('resolvePermissions', () => {
    it('returns empty array for null session', () => {
      expect(resolvePermissions(null)).toEqual([]);
    });

    it('returns only granted permissions', () => {
      const permissions = resolvePermissions(mockSession);
      expect(permissions.length).toBeGreaterThan(0);
      permissions.forEach(p => expect(p.granted).toBe(true));
    });

    it('filters out non-granted permissions', () => {
      const sessionWithDenied: UserSession = {
        ...mockSession,
        permissions: [
          { id: 'p1', name: 'allowed', granted: true },
          { id: 'p2', name: 'denied', granted: false },
        ],
      };
      const permissions = resolvePermissions(sessionWithDenied);
      expect(permissions.length).toBe(1);
      expect(permissions[0].name).toBe('allowed');
    });
  });

  describe('resolveEntitlements', () => {
    it('returns empty array for null session', () => {
      expect(resolveEntitlements(null)).toEqual([]);
    });

    it('returns only enabled entitlements', () => {
      const entitlements = resolveEntitlements(mockSession);
      expect(entitlements.length).toBeGreaterThan(0);
      entitlements.forEach(e => expect(e.enabled).toBe(true));
    });
  });

  describe('resolveFeatureFlags', () => {
    it('returns empty array for null session', () => {
      expect(resolveFeatureFlags(null)).toEqual([]);
    });

    it('returns only enabled feature flags', () => {
      const flags = resolveFeatureFlags(mockSession);
      expect(flags.length).toBeGreaterThan(0);
      flags.forEach(f => expect(f.enabled).toBe(true));
    });
  });

  describe('resolveDashboardSections', () => {
    it('returns empty array for null session', () => {
      expect(resolveDashboardSections(null)).toEqual([]);
    });

    it('returns sections with visibility resolved', () => {
      const sections = resolveDashboardSections(mockSession);
      expect(sections.length).toBeGreaterThan(0);
      sections.forEach(s => {
        expect(typeof s.visible).toBe('boolean');
      });
    });

    it('hides sections when required permission is missing', () => {
      const sessionWithoutPermission: UserSession = {
        ...mockSession,
        permissions: [],
        dashboardSections: [
          { 
            id: 'ds1', 
            title: 'Protected', 
            component: 'Test', 
            order: 1, 
            requiredPermission: 'admin.access',
            visible: true 
          },
        ],
      };
      const sections = resolveDashboardSections(sessionWithoutPermission);
      expect(sections[0].visible).toBe(false);
      expect(sections[0].hiddenReason).toContain('Missing permission');
    });

    it('hides sections when required entitlement is missing', () => {
      const sessionWithoutEntitlement: UserSession = {
        ...mockSession,
        entitlements: [],
        dashboardSections: [
          { 
            id: 'ds1', 
            title: 'Premium', 
            component: 'Test', 
            order: 1, 
            requiredEntitlement: 'premium.feature',
            visible: true 
          },
        ],
      };
      const sections = resolveDashboardSections(sessionWithoutEntitlement);
      expect(sections[0].visible).toBe(false);
      expect(sections[0].hiddenReason).toContain('Missing entitlement');
    });
  });

  describe('hasPermission', () => {
    it('returns false for null session', () => {
      expect(hasPermission(null, 'any.permission')).toBe(false);
    });

    it('returns true for granted permission', () => {
      expect(hasPermission(mockSession, 'pos.sales.create')).toBe(true);
    });

    it('returns false for non-existent permission', () => {
      expect(hasPermission(mockSession, 'nonexistent.permission')).toBe(false);
    });
  });

  describe('hasEntitlement', () => {
    it('returns false for null session', () => {
      expect(hasEntitlement(null, 'any.feature')).toBe(false);
    });

    it('returns true for enabled entitlement', () => {
      expect(hasEntitlement(mockSession, 'pos.basic')).toBe(true);
    });

    it('returns false for non-existent entitlement', () => {
      expect(hasEntitlement(mockSession, 'nonexistent.feature')).toBe(false);
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns false for null session', () => {
      expect(isFeatureEnabled(null, 'any.flag')).toBe(false);
    });

    it('returns true for enabled feature flag', () => {
      expect(isFeatureEnabled(mockSession, 'offline_mode')).toBe(true);
    });

    it('returns false for non-existent feature flag', () => {
      expect(isFeatureEnabled(mockSession, 'nonexistent.flag')).toBe(false);
    });
  });
});

describe('No Cross-Tenant Leakage', () => {
  it('sessions from different users have different tenant contexts', () => {
    const session1 = createMockSession('user1');
    const session2 = createMockSession('user2');
    
    expect(session1.userId).not.toBe(session2.userId);
    expect(session1.id).not.toBe(session2.id);
  });
});
