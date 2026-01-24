/**
 * Demo Safety Guard
 * 
 * Prevents irreversible operations in demo mode.
 * 
 * Canon Authority: Phase D-5 Implementation (Canon Alignment)
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * CRITICAL CANON RULES:
 * - Demo Partner MUST NOT perform irreversible operations
 * - Demo data MUST be clearly separated from production
 * - Demo mode detection MUST use canonical identifiers only
 * 
 * CANONICAL DEMO PARTNER IDENTIFIERS (LOCKED):
 * - Partner Slug: webwaka-demo-partner
 * - Tenant Slug: demo.webwaka
 * - Flag: isDemoPartner = true
 * 
 * This module provides SAFETY GUARDS ONLY.
 */

/**
 * Canonical Demo Partner identifiers
 * 
 * These are the ONLY valid identifiers for the Demo Partner.
 * All legacy identifiers (partner_demo, tenant_demo) have been removed.
 */
export const CANONICAL_DEMO_PARTNER_SLUG = 'webwaka-demo-partner';
export const CANONICAL_DEMO_TENANT_SLUG = 'demo.webwaka';

/**
 * Check if the current context is Demo Partner
 * 
 * This function checks against canonical identifiers only.
 * It accepts session context from Core API which includes isDemoPartner flag.
 * 
 * @param partnerId - Partner ID or slug
 * @param tenantId - Tenant ID or slug
 * @param isDemoPartnerFlag - Optional explicit isDemoPartner flag from Core session
 * @returns true if Demo Partner, false otherwise
 */
export function isDemoPartner(
  partnerId: string | null,
  tenantId: string | null,
  isDemoPartnerFlag?: boolean
): boolean {
  // Preferred: Use explicit isDemoPartner flag from Core session
  if (isDemoPartnerFlag !== undefined) {
    return isDemoPartnerFlag;
  }

  // Fallback: Check canonical slugs
  return (
    partnerId === CANONICAL_DEMO_PARTNER_SLUG ||
    tenantId === CANONICAL_DEMO_TENANT_SLUG
  );
}

/**
 * Demo-protected operation result
 */
export interface DemoProtectedResult<T> {
  allowed: boolean;
  reason?: string;
  data?: T;
}

/**
 * Guard an operation for Demo Partner safety
 * 
 * This function checks if an operation is allowed in demo mode.
 * If not allowed, it returns a result with `allowed: false`.
 * 
 * @param partnerId - Partner ID or slug
 * @param tenantId - Tenant ID or slug
 * @param operationType - Type of operation (e.g., 'delete', 'export', 'payment')
 * @param isDemoPartnerFlag - Optional explicit isDemoPartner flag from Core session
 * @returns Demo-protected result
 */
export function guardDemoOperation<T>(
  partnerId: string | null,
  tenantId: string | null,
  operationType: 'delete' | 'export' | 'payment' | 'irreversible',
  isDemoPartnerFlag?: boolean
): DemoProtectedResult<T> {
  if (!isDemoPartner(partnerId, tenantId, isDemoPartnerFlag)) {
    // Not demo mode - allow all operations
    return { allowed: true };
  }

  // Demo mode - check operation type
  switch (operationType) {
    case 'delete':
      return {
        allowed: false,
        reason: 'Deletion operations are disabled in Demo Partner mode for safety.',
      };

    case 'export':
      return {
        allowed: false,
        reason: 'Export operations are disabled in Demo Partner mode for safety.',
      };

    case 'payment':
      return {
        allowed: false,
        reason: 'Payment processing is disabled in Demo Partner mode. Use test mode instead.',
      };

    case 'irreversible':
      return {
        allowed: false,
        reason: 'Irreversible operations are disabled in Demo Partner mode for safety.',
      };

    default:
      return { allowed: true };
  }
}

/**
 * Demo feature flags
 * 
 * These flags control demo-specific affordances.
 */
export const DEMO_FEATURE_FLAGS = {
  SHOW_DEMO_BANNER: true,
  ALLOW_DEMO_RESET: true,
  ENABLE_DEMO_WATERMARK: true,
  RESTRICT_IRREVERSIBLE_OPS: true,
};

/**
 * Get demo-specific configuration
 * 
 * @param partnerId - Partner ID or slug
 * @param tenantId - Tenant ID or slug
 * @param isDemoPartnerFlag - Optional explicit isDemoPartner flag from Core session
 * @returns Demo configuration
 */
export function getDemoConfig(
  partnerId: string | null,
  tenantId: string | null,
  isDemoPartnerFlag?: boolean
) {
  const isDemo = isDemoPartner(partnerId, tenantId, isDemoPartnerFlag);

  return {
    isDemoMode: isDemo,
    showBanner: isDemo && DEMO_FEATURE_FLAGS.SHOW_DEMO_BANNER,
    allowReset: isDemo && DEMO_FEATURE_FLAGS.ALLOW_DEMO_RESET,
    enableWatermark: isDemo && DEMO_FEATURE_FLAGS.ENABLE_DEMO_WATERMARK,
    restrictIrreversibleOps: isDemo && DEMO_FEATURE_FLAGS.RESTRICT_IRREVERSIBLE_OPS,
  };
}
