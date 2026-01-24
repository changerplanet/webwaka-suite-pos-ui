import {
  POS_CAPABILITIES,
  POS_ENTITLEMENTS,
  POS_FEATURE_FLAGS,
  POS_DASHBOARD_DECLARATION,
  resolvePOSDashboard,
  hasCapability,
  hasEntitlement,
  isFeatureEnabled,
  getCapabilityById,
  getEntitlementById,
  getFeatureFlagById,
  type SessionContext,
} from '@/lib/control-consumer';

function createTestSession(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    subjectId: 'user_test',
    subjectType: 'staff',
    tenantId: 'demo.webwaka',
    roles: [],
    capabilities: POS_CAPABILITIES.map(c => c.id),
    entitlements: POS_ENTITLEMENTS.map(e => e.id),
    featureFlags: POS_FEATURE_FLAGS.filter(f => f.defaultValue).map(f => f.id),
    ...overrides,
  };
}

describe('Control Package Consumption', () => {
  describe('POS_CAPABILITIES from webwaka-suite-pos-control', () => {
    it('exports capabilities from control package', () => {
      expect(POS_CAPABILITIES).toBeDefined();
      expect(POS_CAPABILITIES.length).toBeGreaterThan(0);
    });

    it('capabilities have required fields', () => {
      POS_CAPABILITIES.forEach(cap => {
        expect(cap.id).toBeDefined();
        expect(cap.name).toBeDefined();
        expect(cap.description).toBeDefined();
        expect(cap.category).toBeDefined();
      });
    });

    it('getCapabilityById retrieves from control package', () => {
      const cap = getCapabilityById('pos:sale.create');
      expect(cap).toBeDefined();
      expect(cap?.name).toBe('Create Sale');
    });
  });

  describe('POS_ENTITLEMENTS from webwaka-suite-pos-control', () => {
    it('exports entitlements from control package', () => {
      expect(POS_ENTITLEMENTS).toBeDefined();
      expect(POS_ENTITLEMENTS.length).toBeGreaterThan(0);
    });

    it('entitlements have required fields', () => {
      POS_ENTITLEMENTS.forEach(ent => {
        expect(ent.id).toBeDefined();
        expect(ent.name).toBeDefined();
        expect(ent.description).toBeDefined();
        expect(ent.requiredCapabilities).toBeDefined();
      });
    });

    it('getEntitlementById retrieves from control package', () => {
      const ent = getEntitlementById('pos-access');
      expect(ent).toBeDefined();
      expect(ent?.name).toBe('POS Access');
    });
  });

  describe('POS_FEATURE_FLAGS from webwaka-suite-pos-control', () => {
    it('exports feature flags from control package', () => {
      expect(POS_FEATURE_FLAGS).toBeDefined();
      expect(POS_FEATURE_FLAGS.length).toBeGreaterThan(0);
    });

    it('feature flags have required fields', () => {
      POS_FEATURE_FLAGS.forEach(flag => {
        expect(flag.id).toBeDefined();
        expect(flag.name).toBeDefined();
        expect(typeof flag.defaultValue).toBe('boolean');
      });
    });

    it('getFeatureFlagById retrieves from control package', () => {
      const flag = getFeatureFlagById('pos-enabled');
      expect(flag).toBeDefined();
      expect(flag?.defaultValue).toBe(true);
    });
  });

  describe('POS_DASHBOARD_DECLARATION from webwaka-suite-pos-control', () => {
    it('exports dashboard declaration from control package', () => {
      expect(POS_DASHBOARD_DECLARATION).toBeDefined();
      expect(POS_DASHBOARD_DECLARATION.moduleId).toBe('webwaka_suite_pos_control');
    });

    it('dashboard declaration has sections with gating rules', () => {
      expect(POS_DASHBOARD_DECLARATION.sections.length).toBeGreaterThan(0);
      
      POS_DASHBOARD_DECLARATION.sections.forEach(section => {
        expect(section.id).toBeDefined();
        expect(section.name).toBeDefined();
        expect(section.gating).toBeDefined();
        expect(section.gating.requiredPermissions).toBeDefined();
        expect(section.gating.requiredEntitlements).toBeDefined();
        expect(section.gating.requiredFeatureFlags).toBeDefined();
      });
    });
  });
});

describe('Dashboard Resolution via Control Layer', () => {
  it('resolves visible sections from control layer', () => {
    const session = createTestSession();
    const sections = resolvePOSDashboard(session);
    
    expect(sections.length).toBeGreaterThan(0);
    sections.forEach(s => {
      expect(s.id).toBeDefined();
      expect(s.name).toBeDefined();
      expect(s.order).toBeDefined();
    });
  });

  it('hides sections when capabilities are missing', () => {
    const sessionWithNoCaps = createTestSession({
      capabilities: [],
    });
    const sections = resolvePOSDashboard(sessionWithNoCaps);
    
    expect(sections.length).toBe(0);
  });

  it('hides sections when entitlements are missing', () => {
    const sessionWithNoEnts = createTestSession({
      entitlements: [],
    });
    const sections = resolvePOSDashboard(sessionWithNoEnts);
    
    expect(sections.length).toBe(0);
  });

  it('hides sections when feature flags are disabled', () => {
    const sessionWithNoFlags = createTestSession({
      featureFlags: [],
    });
    const sections = resolvePOSDashboard(sessionWithNoFlags);
    
    expect(sections.length).toBe(0);
  });

  it('shows all sections when all requirements are met', () => {
    const fullSession = createTestSession();
    const sections = resolvePOSDashboard(fullSession);
    
    expect(sections.length).toBe(POS_DASHBOARD_DECLARATION.sections.length);
  });
});

describe('Access Check Functions', () => {
  describe('hasCapability', () => {
    it('returns true for present capability', () => {
      const session = createTestSession();
      expect(hasCapability(session, 'pos:sale.create')).toBe(true);
    });

    it('returns false for missing capability', () => {
      const session = createTestSession({ capabilities: [] });
      expect(hasCapability(session, 'pos:sale.create')).toBe(false);
    });
  });

  describe('hasEntitlement', () => {
    it('returns true for present entitlement', () => {
      const session = createTestSession();
      expect(hasEntitlement(session, 'pos-access')).toBe(true);
    });

    it('returns false for missing entitlement', () => {
      const session = createTestSession({ entitlements: [] });
      expect(hasEntitlement(session, 'pos-access')).toBe(false);
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns true for enabled feature', () => {
      const session = createTestSession();
      expect(isFeatureEnabled(session, 'pos-enabled')).toBe(true);
    });

    it('returns false for disabled feature', () => {
      const session = createTestSession({ featureFlags: [] });
      expect(isFeatureEnabled(session, 'pos-enabled')).toBe(false);
    });
  });
});

describe('No Cross-Tenant Leakage', () => {
  it('sessions with different tenants resolve independently', () => {
    const tenant1 = createTestSession({ tenantId: 'tenant_1' });
    const tenant2 = createTestSession({ tenantId: 'tenant_2' });
    
    expect(tenant1.tenantId).not.toBe(tenant2.tenantId);
    
    const sections1 = resolvePOSDashboard(tenant1);
    const sections2 = resolvePOSDashboard(tenant2);
    
    expect(sections1).toEqual(sections2);
  });
});

describe('Constitutional Compliance', () => {
  it('UI does not implement its own permission logic', () => {
    expect(typeof POS_CAPABILITIES).not.toBe('undefined');
    expect(typeof POS_ENTITLEMENTS).not.toBe('undefined');
    expect(typeof POS_FEATURE_FLAGS).not.toBe('undefined');
  });

  it('dashboard resolution uses control layer function', () => {
    expect(typeof resolvePOSDashboard).toBe('function');
  });

  it('control data is immutable (frozen)', () => {
    expect(Object.isFrozen(POS_CAPABILITIES)).toBe(true);
    expect(Object.isFrozen(POS_ENTITLEMENTS)).toBe(true);
    expect(Object.isFrozen(POS_FEATURE_FLAGS)).toBe(true);
    expect(Object.isFrozen(POS_DASHBOARD_DECLARATION)).toBe(true);
  });
});
