'use client';

import type { DashboardSection, UserSession } from '@/types/core';
import { resolveDashboardSections } from '@/lib/control-consumer';

interface DashboardRendererProps {
  session: UserSession;
  devMode?: boolean;
}

export function DashboardRenderer({ session, devMode = false }: DashboardRendererProps) {
  const sections = resolveDashboardSections(session);

  return (
    <div className="space-y-4">
      {devMode && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm">
          <div className="font-medium text-yellow-400 mb-2">Dev Mode: Section Visibility</div>
          <div className="space-y-1 text-xs">
            {sections.map(section => (
              <div key={section.id} className="flex items-center gap-2">
                <span className={section.visible ? 'text-green-400' : 'text-red-400'}>
                  {section.visible ? '✓' : '✗'}
                </span>
                <span>{section.title}</span>
                {!section.visible && section.hiddenReason && (
                  <span className="text-gray-500">- {section.hiddenReason}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid gap-3">
        {sections
          .filter(section => section.visible)
          .sort((a, b) => a.order - b.order)
          .map(section => (
            <DashboardSectionCard key={section.id} section={section} />
          ))}
      </div>
    </div>
  );
}

function DashboardSectionCard({ section }: { section: DashboardSection }) {
  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700 p-4">
      <h3 className="font-medium text-lg mb-2">{section.title}</h3>
      <div className="text-sm text-gray-400">
        Component: {section.component}
      </div>
    </div>
  );
}
