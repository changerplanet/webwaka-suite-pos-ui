/**
 * useEntitlements Hook
 * 
 * Provides feature gating based on entitlements.
 * 
 * Canon Authority: Phase D-5 Implementation (Canon Alignment)
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * Responsibilities:
 * - Provide read-only access to entitlements
 * - Enable/disable UI features based on entitlements
 * - Show soft warnings when offline
 * - Preserve offline functionality
 * - Use canonical Demo Partner identifiers only
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  resolveEntitlements,
  isEntitlementEnabled,
  isFeatureFlagEnabled,
  getDemoPartnerEntitlements,
  clearCachedEntitlements,
} from '@/lib/entitlement-manager';
import { CANONICAL_DEMO_PARTNER_SLUG, CANONICAL_DEMO_TENANT_SLUG } from '@/lib/demo-safety-guard';
import type { CoreEntitlementResponse } from '@/lib/entitlement-manager';

export function useEntitlements(tenantId: string | null, partnerId: string | null) {
  const [entitlements, setEntitlements] = useState<CoreEntitlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const loadEntitlements = useCallback(async () => {
    if (!tenantId || !partnerId) {
      setLoading(false);
      return;
    }

    try {
      // Special case: Demo Partner always has full entitlements
      // Use canonical identifiers only
      if (partnerId === CANONICAL_DEMO_PARTNER_SLUG || tenantId === CANONICAL_DEMO_TENANT_SLUG) {
        const demoEntitlements = getDemoPartnerEntitlements(tenantId, partnerId);
        setEntitlements(demoEntitlements);
        setLoading(false);
        return;
      }

      // Resolve entitlements from Core or cache
      const resolved = await resolveEntitlements(tenantId);
      setEntitlements(resolved);
    } catch (error) {
      console.error('[useEntitlements] Failed to load entitlements:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, partnerId]);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load entitlements on mount and when tenant/partner changes
  useEffect(() => {
    loadEntitlements();
  }, [loadEntitlements]);

  // Reload entitlements when coming online
  useEffect(() => {
    if (isOnline) {
      loadEntitlements();
    }
  }, [isOnline, loadEntitlements]);

  const hasEntitlement = useCallback(
    (featureKey: string): boolean => {
      return isEntitlementEnabled(entitlements, featureKey);
    },
    [entitlements]
  );

  const hasFeatureFlag = useCallback(
    (flagKey: string): boolean => {
      return isFeatureFlagEnabled(entitlements, flagKey);
    },
    [entitlements]
  );

  const clearEntitlements = useCallback(() => {
    setEntitlements(null);
    clearCachedEntitlements();
  }, []);

  return {
    entitlements,
    loading,
    isOnline,
    hasEntitlement,
    hasFeatureFlag,
    reloadEntitlements: loadEntitlements,
    clearEntitlements,
  };
}
