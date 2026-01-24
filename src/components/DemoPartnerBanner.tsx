/**
 * Demo Partner Safety Banner
 * 
 * Provides explicit demo protections and visual indicators.
 * 
 * Canon Authority: Phase D-4.4 Implementation
 * Mandate: STOP-SAFE / CANON-LOCK
 * 
 * CRITICAL CANON RULES:
 * - All demos MUST run safely inside the canonical Demo Partner
 * - Demo data MUST be clearly marked as non-production
 * - No irreversible operations allowed in demo mode
 * 
 * This component provides SAFETY GUARDS and VISIBILITY.
 */

'use client';

import { useState } from 'react';

interface DemoPartnerBannerProps {
  partnerId: string;
  tenantId: string;
}

export function DemoPartnerBanner({ partnerId, tenantId }: DemoPartnerBannerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Check if this is the Demo Partner
  const isDemoPartner = partnerId === 'partner_demo' || tenantId === 'tenant_demo';

  if (!isDemoPartner) {
    return null;
  }

  if (isMinimized) {
    return (
      <div
        className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 flex items-center justify-between z-50 cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <span className="text-sm font-semibold">🎭 DEMO MODE</span>
        <button className="text-xs underline">Expand</button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🎭</span>
          <div>
            <p className="font-bold text-lg">DEMO PARTNER MODE</p>
            <p className="text-sm opacity-90">
              This is a safe demo environment. All data is non-production and can be reset.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition text-sm"
        >
          Minimize
        </button>
      </div>
    </div>
  );
}
