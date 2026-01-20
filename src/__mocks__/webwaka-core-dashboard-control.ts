export interface DashboardSection {
  sectionId: string;
  label: string;
  icon?: string;
  requiredCapabilities?: string[];
  requiredEntitlements?: string[];
  requiredFeatures?: string[];
  children?: DashboardSection[];
}

export interface DashboardDeclaration {
  dashboardId: string;
  label: string;
  allowedSubjects: string[];
  allowedTenants?: string[];
  allowedPartners?: string[];
  requiredCapabilities?: string[];
  requiredEntitlements?: string[];
  requiredFeatures?: string[];
  sections: DashboardSection[];
}

export type SubjectType = 'super_admin' | 'partner_admin' | 'tenant_admin' | 'staff' | 'user';

export interface DashboardContext {
  subjectId: string;
  subjectType: SubjectType;
  tenantId: string;
  partnerId?: string;
  roles: string[];
  evaluationTime: Date;
}

export interface HiddenReason {
  sectionId: string;
  reason: 'missing_capability' | 'missing_entitlement' | 'missing_feature' | 'tenant_not_allowed' | 'partner_not_allowed' | 'subject_not_allowed';
  details: string;
}

export interface ResolvedDashboard {
  dashboardId: string;
  visibleSections: DashboardSection[];
  hiddenSections: string[];
  reasons: HiddenReason[];
}

export interface DashboardSnapshot {
  snapshotId: string;
  dashboardId: string;
  subjectId: string;
  tenantId: string;
  resolvedSections: DashboardSection[];
  hiddenSections: string[];
  reasons: HiddenReason[];
  checksum: string;
  evaluationTime: Date;
  expiresAt?: Date;
}

export interface PermissionResult {
  subjectId: string;
  capabilities: string[];
  deniedCapabilities?: string[];
}

export interface EntitlementSnapshot {
  tenantId: string;
  activeEntitlements: string[];
  expiredEntitlements?: string[];
}

export interface FeatureSnapshot {
  enabledFeatures: string[];
  disabledFeatures?: string[];
}

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

export class PartnerIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PartnerIsolationError';
  }
}

export class SubjectAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubjectAccessError';
  }
}

function checkCapabilities(
  required: string[] | undefined,
  available: string[]
): { allowed: boolean; missing: string[] } {
  if (!required || required.length === 0) {
    return { allowed: true, missing: [] };
  }
  const missing = required.filter((cap) => !available.includes(cap));
  return { allowed: missing.length === 0, missing };
}

function checkEntitlements(
  required: string[] | undefined,
  active: string[]
): { allowed: boolean; missing: string[] } {
  if (!required || required.length === 0) {
    return { allowed: true, missing: [] };
  }
  const missing = required.filter((ent) => !active.includes(ent));
  return { allowed: missing.length === 0, missing };
}

function checkFeatures(
  required: string[] | undefined,
  enabled: string[]
): { allowed: boolean; missing: string[] } {
  if (!required || required.length === 0) {
    return { allowed: true, missing: [] };
  }
  const missing = required.filter((feat) => !enabled.includes(feat));
  return { allowed: missing.length === 0, missing };
}

export function resolveDashboard(
  declaration: DashboardDeclaration,
  _context: DashboardContext,
  permissionResult: PermissionResult,
  entitlementSnapshot: EntitlementSnapshot,
  featureSnapshot: FeatureSnapshot
): ResolvedDashboard {
  const reasons: HiddenReason[] = [];
  const hiddenSections: string[] = [];
  const visibleSections: DashboardSection[] = [];

  const capCheck = checkCapabilities(
    declaration.requiredCapabilities,
    permissionResult.capabilities
  );
  if (!capCheck.allowed) {
    return {
      dashboardId: declaration.dashboardId,
      visibleSections: [],
      hiddenSections: declaration.sections.map((s) => s.sectionId),
      reasons: [
        {
          sectionId: declaration.dashboardId,
          reason: 'missing_capability',
          details: `Dashboard requires capabilities: ${capCheck.missing.join(', ')}`,
        },
      ],
    };
  }

  const entCheck = checkEntitlements(
    declaration.requiredEntitlements,
    entitlementSnapshot.activeEntitlements
  );
  if (!entCheck.allowed) {
    return {
      dashboardId: declaration.dashboardId,
      visibleSections: [],
      hiddenSections: declaration.sections.map((s) => s.sectionId),
      reasons: [
        {
          sectionId: declaration.dashboardId,
          reason: 'missing_entitlement',
          details: `Dashboard requires entitlements: ${entCheck.missing.join(', ')}`,
        },
      ],
    };
  }

  const featCheck = checkFeatures(
    declaration.requiredFeatures,
    featureSnapshot.enabledFeatures
  );
  if (!featCheck.allowed) {
    return {
      dashboardId: declaration.dashboardId,
      visibleSections: [],
      hiddenSections: declaration.sections.map((s) => s.sectionId),
      reasons: [
        {
          sectionId: declaration.dashboardId,
          reason: 'missing_feature',
          details: `Dashboard requires features: ${featCheck.missing.join(', ')}`,
        },
      ],
    };
  }

  for (const section of declaration.sections) {
    const sCapCheck = checkCapabilities(
      section.requiredCapabilities,
      permissionResult.capabilities
    );
    if (!sCapCheck.allowed) {
      hiddenSections.push(section.sectionId);
      reasons.push({
        sectionId: section.sectionId,
        reason: 'missing_capability',
        details: `Missing capabilities: ${sCapCheck.missing.join(', ')}`,
      });
      continue;
    }

    const sEntCheck = checkEntitlements(
      section.requiredEntitlements,
      entitlementSnapshot.activeEntitlements
    );
    if (!sEntCheck.allowed) {
      hiddenSections.push(section.sectionId);
      reasons.push({
        sectionId: section.sectionId,
        reason: 'missing_entitlement',
        details: `Missing entitlements: ${sEntCheck.missing.join(', ')}`,
      });
      continue;
    }

    const sFeatCheck = checkFeatures(
      section.requiredFeatures,
      featureSnapshot.enabledFeatures
    );
    if (!sFeatCheck.allowed) {
      hiddenSections.push(section.sectionId);
      reasons.push({
        sectionId: section.sectionId,
        reason: 'missing_feature',
        details: `Missing features: ${sFeatCheck.missing.join(', ')}`,
      });
      continue;
    }

    visibleSections.push(section);
  }

  return {
    dashboardId: declaration.dashboardId,
    visibleSections,
    hiddenSections,
    reasons,
  };
}

export function createSnapshot(
  resolved: ResolvedDashboard,
  context: DashboardContext
): DashboardSnapshot {
  const checksum = `${resolved.dashboardId}-${context.subjectId}-${Date.now()}`;
  return {
    snapshotId: `snap_${Date.now()}`,
    dashboardId: resolved.dashboardId,
    subjectId: context.subjectId,
    tenantId: context.tenantId,
    resolvedSections: resolved.visibleSections,
    hiddenSections: resolved.hiddenSections,
    reasons: resolved.reasons,
    checksum,
    evaluationTime: context.evaluationTime,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

export function validateSnapshot(snapshot: DashboardSnapshot): boolean {
  if (!snapshot.checksum || !snapshot.snapshotId) {
    return false;
  }
  if (snapshot.expiresAt && new Date() > snapshot.expiresAt) {
    return false;
  }
  return true;
}
