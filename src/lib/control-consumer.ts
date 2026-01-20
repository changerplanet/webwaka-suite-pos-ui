import {
  POS_CAPABILITIES,
  getCapabilityById as getPOSCapabilityById,
  getCapabilitiesByCategory,
  getAllCapabilityIds,
} from 'webwaka-suite-pos-control/src/capabilities';

import {
  POS_ENTITLEMENTS,
  getEntitlementById as getPOSEntitlementById,
  getEntitlementsByCapability,
  getAllEntitlementIds,
} from 'webwaka-suite-pos-control/src/entitlements';

import {
  POS_FEATURE_FLAGS,
  getFeatureFlagById as getPOSFeatureFlagById,
  getDefaultFeatureFlagValues,
  getAllFeatureFlagIds,
} from 'webwaka-suite-pos-control/src/featureFlags';

import {
  POS_DASHBOARD_DECLARATION,
  resolveVisibleSections,
  getDashboardDeclaration,
  getSectionById,
} from 'webwaka-suite-pos-control/src/dashboard/pos.dashboard';

import type {
  Capability,
  Entitlement as POSEntitlement,
  FeatureFlag as POSFeatureFlag,
  TenantContext,
  VisibleSection,
  DashboardDeclaration,
} from 'webwaka-suite-pos-control/src/types';

import {
  resolveDashboard,
  TenantIsolationError,
  PartnerIsolationError,
  SubjectAccessError,
} from 'webwaka-core-dashboard-control/src/engine/resolver';

import {
  generateDashboardSnapshot,
  verifyDashboardSnapshot,
  verifySnapshotIntegrity,
  evaluateFromSnapshot,
} from 'webwaka-core-dashboard-control/src/engine/snapshot';

import type {
  DashboardContext,
  PermissionResult,
  EntitlementSnapshot,
  FeatureSnapshot,
  ResolvedDashboard,
  DashboardSnapshot,
  HiddenReason,
  DashboardSection as CoreDashboardSection,
  DashboardDeclaration as CoreDashboardDeclaration,
} from 'webwaka-core-dashboard-control/src/models/schemas';

export type {
  Capability,
  POSEntitlement,
  POSFeatureFlag,
  TenantContext,
  VisibleSection,
  DashboardDeclaration,
  DashboardContext,
  PermissionResult,
  EntitlementSnapshot,
  FeatureSnapshot,
  ResolvedDashboard,
  DashboardSnapshot,
  HiddenReason,
  CoreDashboardSection,
  CoreDashboardDeclaration,
};

export {
  POS_CAPABILITIES,
  POS_ENTITLEMENTS,
  POS_FEATURE_FLAGS,
  POS_DASHBOARD_DECLARATION,
  resolveDashboard,
  resolveVisibleSections,
  getDefaultFeatureFlagValues,
  getDashboardDeclaration,
  getSectionById,
  getCapabilitiesByCategory,
  getAllCapabilityIds,
  getEntitlementsByCapability,
  getAllEntitlementIds,
  getAllFeatureFlagIds,
  generateDashboardSnapshot,
  verifyDashboardSnapshot,
  verifySnapshotIntegrity,
  evaluateFromSnapshot,
  TenantIsolationError,
  PartnerIsolationError,
  SubjectAccessError,
};

export interface SessionContext {
  subjectId: string;
  subjectType: 'super_admin' | 'partner_admin' | 'tenant_admin' | 'staff' | 'user';
  tenantId: string;
  partnerId?: string;
  roles: string[];
  capabilities: string[];
  entitlements: string[];
  featureFlags: string[];
}

export function createDashboardContext(session: SessionContext): DashboardContext {
  return {
    subjectId: session.subjectId,
    subjectType: session.subjectType,
    tenantId: session.tenantId,
    partnerId: session.partnerId,
    roles: session.roles,
    evaluationTime: new Date(),
  };
}

export function createPermissionResult(session: SessionContext): PermissionResult {
  return {
    subjectId: session.subjectId,
    capabilities: session.capabilities,
  };
}

export function createEntitlementSnapshot(session: SessionContext): EntitlementSnapshot {
  return {
    tenantId: session.tenantId,
    activeEntitlements: session.entitlements,
  };
}

export function createFeatureSnapshot(session: SessionContext): FeatureSnapshot {
  return {
    enabledFeatures: session.featureFlags,
  };
}

export function resolvePOSDashboard(session: SessionContext): VisibleSection[] {
  const context: TenantContext = {
    tenantId: session.tenantId,
    permissions: session.capabilities,
    entitlements: session.entitlements,
    featureFlags: session.featureFlags.reduce((acc, flag) => {
      acc[flag] = true;
      return acc;
    }, {} as Record<string, boolean>),
  };
  
  return [...resolveVisibleSections(context)];
}

export function hasCapability(session: SessionContext, capabilityId: string): boolean {
  return session.capabilities.includes(capabilityId);
}

export function hasEntitlement(session: SessionContext, entitlementId: string): boolean {
  return session.entitlements.includes(entitlementId);
}

export function isFeatureEnabled(session: SessionContext, featureId: string): boolean {
  return session.featureFlags.includes(featureId);
}

export function getCapabilityById(id: string): Capability | undefined {
  return getPOSCapabilityById(id);
}

export function getEntitlementById(id: string): POSEntitlement | undefined {
  return getPOSEntitlementById(id);
}

export function getFeatureFlagById(id: string): POSFeatureFlag | undefined {
  return getPOSFeatureFlagById(id);
}
