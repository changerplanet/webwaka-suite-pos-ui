'use client';

import type { UserSession } from '@/types/core';
import {
  resolvePOSDashboard,
  type SessionContext,
  type VisibleSection,
} from '@/lib/control-consumer';

interface DashboardRendererProps {
  session: UserSession;
  devMode?: boolean;
}

function userSessionToContext(session: UserSession): SessionContext {
  return {
    subjectId: session.userId,
    subjectType: 'staff',
    tenantId: session.tenantId,
    roles: [],
    capabilities: session.permissions.filter(p => p.granted).map(p => p.name),
    entitlements: session.entitlements.filter(e => e.enabled).map(e => e.featureKey),
    featureFlags: session.featureFlags.filter(f => f.enabled).map(f => f.key),
  };
}

export function DashboardRenderer({ session, devMode = false }: DashboardRendererProps) {
  const context = userSessionToContext(session);
  const visibleSections = resolvePOSDashboard(context);
  
  const allSectionIds = ['pos-sales', 'pos-shifts', 'pos-inventory', 'pos-reports', 'pos-settings'];
  const visibleIds = new Set(visibleSections.map(s => s.id));
  const hiddenSections = allSectionIds.filter(id => !visibleIds.has(id));

  return (
    <div className="space-y-4">
      {devMode && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm">
          <div className="font-medium text-yellow-400 mb-2">Dev Mode: Section Visibility (from control layer)</div>
          <div className="space-y-1 text-xs">
            {visibleSections.map(section => (
              <div key={section.id} className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>{section.name}</span>
              </div>
            ))}
            {hiddenSections.map(sectionId => (
              <div key={sectionId} className="flex items-center gap-2">
                <span className="text-red-400">✗</span>
                <span>{sectionId}</span>
                <span className="text-gray-500">- Missing required permissions/entitlements</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid gap-3">
        {visibleSections
          .sort((a, b) => a.order - b.order)
          .map(section => (
            <DashboardSectionCard key={section.id} section={section} />
          ))}
      </div>
    </div>
  );
}

function DashboardSectionCard({ section }: { section: VisibleSection }) {
  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700 p-4">
      <h3 className="font-medium text-lg mb-2">{section.name}</h3>
      <div className="text-sm text-gray-400">
        Section ID: {section.id}
      </div>
    </div>
  );
}
