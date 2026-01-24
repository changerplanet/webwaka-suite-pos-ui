/**
 * Demo Safety Guard
 * 
 * Prevents irreversible operations in demo mode.
 * 
 * Canon Authority: Phase D-4.4 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * CRITICAL CANON RULES:
 * - Demo Partner MUST NOT perform irreversible operations
 * - Demo data MUST be clearly separated from production
 * - Easy demo reset hooks (guards only, no mutation yet)
 * 
 * This module provides SAFETY GUARDS ONLY.
 */

/**
 * Check if the current context is Demo Partner
 * 
 * @param partnerId - Partner ID
 * @param tenantId - Tenant ID
 * @returns true if Demo Partner, false otherwise
 */
export function isDemoPartner(partnerId: string | null, tenantId: string | null): boolean {
  return partnerId === 'partner_demo' || tenantId === 'tenant_demo';
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
 * @param partnerId - Partner ID
 * @param tenantId - Tenant ID
 * @param operationType - Type of operation (e.g., 'delete', 'export', 'payment')
 * @returns Demo-protected result
 */
export function guardDemoOperation<T>(
  partnerId: string | null,
  tenantId: string | null,
  operationType: 'delete' | 'export' | 'payment' | 'irreversible'
): DemoProtectedResult<T> {
  if (!isDemoPartner(partnerId, tenantId)) {
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
      // Export is allowed in demo mode (read-only)
      return { allowed: true };

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
 * @param partnerId - Partner ID
 * @param tenantId - Tenant ID
 * @returns Demo configuration
 */
export function getDemoConfig(partnerId: string | null, tenantId: string | null) {
  const isDemo = isDemoPartner(partnerId, tenantId);

  return {
    isDemoMode: isDemo,
    showBanner: isDemo && DEMO_FEATURE_FLAGS.SHOW_DEMO_BANNER,
    allowReset: isDemo && DEMO_FEATURE_FLAGS.ALLOW_DEMO_RESET,
    enableWatermark: isDemo && DEMO_FEATURE_FLAGS.ENABLE_DEMO_WATERMARK,
    restrictIrreversibleOps: isDemo && DEMO_FEATURE_FLAGS.RESTRICT_IRREVERSIBLE_OPS,
  };
}
