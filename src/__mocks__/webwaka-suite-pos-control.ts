export interface Capability {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
}

export interface Entitlement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly requiredCapabilities: readonly string[];
}

export interface FeatureFlag {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly defaultValue: boolean;
}

export interface DashboardSectionGating {
  readonly requiredPermissions: readonly string[];
  readonly requiredEntitlements: readonly string[];
  readonly requiredFeatureFlags: readonly string[];
}

export interface DashboardSection {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly gating: DashboardSectionGating;
}

export interface DashboardDeclaration {
  readonly moduleId: string;
  readonly sections: readonly DashboardSection[];
}

export interface TenantContext {
  readonly tenantId: string;
  readonly permissions: readonly string[];
  readonly entitlements: readonly string[];
  readonly featureFlags: Record<string, boolean>;
}

export interface VisibleSection {
  readonly id: string;
  readonly name: string;
  readonly order: number;
}

export const POS_CAPABILITIES: readonly Capability[] = Object.freeze([
  { id: 'pos:sale.create', name: 'Create Sale', description: 'Ability to create new sales transactions', category: 'sales' },
  { id: 'pos:sale.view', name: 'View Sales', description: 'Ability to view sales transactions', category: 'sales' },
  { id: 'pos:sale.refund', name: 'Process Refund', description: 'Ability to process refunds for sales', category: 'sales' },
  { id: 'pos:sale.void', name: 'Void Sale', description: 'Ability to void sales transactions', category: 'sales' },
  { id: 'pos:shift.open', name: 'Open Shift', description: 'Ability to open a cashier shift', category: 'shifts' },
  { id: 'pos:shift.close', name: 'Close Shift', description: 'Ability to close a cashier shift', category: 'shifts' },
  { id: 'pos:shift.view', name: 'View Shifts', description: 'Ability to view shift history', category: 'shifts' },
  { id: 'pos:inventory.view', name: 'View Inventory', description: 'Ability to view inventory levels', category: 'inventory' },
  { id: 'pos:inventory.adjust', name: 'Adjust Inventory', description: 'Ability to make inventory adjustments', category: 'inventory' },
  { id: 'pos:reports.view', name: 'View Reports', description: 'Ability to view POS reports', category: 'reports' },
  { id: 'pos:reports.export', name: 'Export Reports', description: 'Ability to export POS reports', category: 'reports' },
  { id: 'pos:settings.view', name: 'View Settings', description: 'Ability to view POS settings', category: 'settings' },
  { id: 'pos:settings.manage', name: 'Manage Settings', description: 'Ability to modify POS settings', category: 'settings' },
]);

export const POS_ENTITLEMENTS: readonly Entitlement[] = Object.freeze([
  { id: 'pos-access', name: 'POS Access', description: 'Basic access to POS functionality', requiredCapabilities: ['pos:sale.view', 'pos:shift.view'] },
  { id: 'pos-cashier', name: 'POS Cashier', description: 'Standard cashier operations', requiredCapabilities: ['pos:sale.create', 'pos:sale.view', 'pos:shift.open', 'pos:shift.close'] },
  { id: 'pos-supervisor', name: 'POS Supervisor', description: 'Supervisor-level POS operations including refunds', requiredCapabilities: ['pos:sale.refund', 'pos:sale.void', 'pos:inventory.view'] },
  { id: 'pos-offline-enabled', name: 'Offline Mode', description: 'Ability to process sales in offline mode', requiredCapabilities: ['pos:sale.create'] },
  { id: 'pos-multi-location', name: 'Multi-Location', description: 'Access to multiple POS locations', requiredCapabilities: ['pos:shift.view', 'pos:inventory.view'] },
  { id: 'pos-advanced-reports', name: 'Advanced Reports', description: 'Access to advanced reporting features', requiredCapabilities: ['pos:reports.view', 'pos:reports.export'] },
  { id: 'pos-inventory-management', name: 'Inventory Management', description: 'Full inventory management capabilities', requiredCapabilities: ['pos:inventory.view', 'pos:inventory.adjust'] },
  { id: 'pos-admin', name: 'POS Admin', description: 'Full administrative access to POS settings', requiredCapabilities: ['pos:settings.view', 'pos:settings.manage'] },
]);

export const POS_FEATURE_FLAGS: readonly FeatureFlag[] = Object.freeze([
  { id: 'pos-enabled', name: 'POS Enabled', description: 'Master switch to enable/disable POS module', defaultValue: true },
  { id: 'pos-offline-sales', name: 'Offline Sales', description: 'Enable offline sales processing capability', defaultValue: false },
  { id: 'pos-cash-rounding', name: 'Cash Rounding', description: 'Enable cash rounding for transactions', defaultValue: false },
  { id: 'pos-nigeria-vat', name: 'Nigeria VAT', description: 'Enable Nigeria-specific VAT handling', defaultValue: false },
  { id: 'pos-quick-sale', name: 'Quick Sale Mode', description: 'Enable quick sale mode for faster checkout', defaultValue: true },
  { id: 'pos-barcode-scanning', name: 'Barcode Scanning', description: 'Enable barcode scanning functionality', defaultValue: true },
  { id: 'pos-receipt-printing', name: 'Receipt Printing', description: 'Enable receipt printing functionality', defaultValue: true },
  { id: 'pos-split-payments', name: 'Split Payments', description: 'Allow splitting payments across multiple methods', defaultValue: false },
  { id: 'pos-customer-display', name: 'Customer Display', description: 'Enable customer-facing display support', defaultValue: false },
  { id: 'pos-inventory-alerts', name: 'Inventory Alerts', description: 'Show low inventory alerts during sales', defaultValue: true },
]);

export const POS_DASHBOARD_DECLARATION: DashboardDeclaration = Object.freeze({
  moduleId: 'webwaka_suite_pos_control',
  sections: Object.freeze([
    { id: 'pos-sales', name: 'Sales', order: 1, gating: { requiredPermissions: ['pos:sale.view'], requiredEntitlements: ['pos-access'], requiredFeatureFlags: ['pos-enabled'] } },
    { id: 'pos-shifts', name: 'Shifts', order: 2, gating: { requiredPermissions: ['pos:shift.view'], requiredEntitlements: ['pos-access'], requiredFeatureFlags: ['pos-enabled'] } },
    { id: 'pos-inventory', name: 'Inventory', order: 3, gating: { requiredPermissions: ['pos:inventory.view'], requiredEntitlements: ['pos-inventory-management'], requiredFeatureFlags: ['pos-enabled'] } },
    { id: 'pos-reports', name: 'Reports', order: 4, gating: { requiredPermissions: ['pos:reports.view'], requiredEntitlements: ['pos-advanced-reports'], requiredFeatureFlags: ['pos-enabled'] } },
    { id: 'pos-settings', name: 'Settings', order: 5, gating: { requiredPermissions: ['pos:settings.view'], requiredEntitlements: ['pos-admin'], requiredFeatureFlags: ['pos-enabled'] } },
  ])
});

function isSectionVisible(section: DashboardSection, context: TenantContext): boolean {
  const hasAllPermissions = section.gating.requiredPermissions.every(
    perm => context.permissions.includes(perm)
  );
  const hasAllEntitlements = section.gating.requiredEntitlements.every(
    ent => context.entitlements.includes(ent)
  );
  const hasAllFeatureFlags = section.gating.requiredFeatureFlags.every(
    flag => context.featureFlags[flag] === true
  );
  return hasAllPermissions && hasAllEntitlements && hasAllFeatureFlags;
}

export function resolveVisibleSections(context: TenantContext): readonly VisibleSection[] {
  return POS_DASHBOARD_DECLARATION.sections
    .filter(section => isSectionVisible(section, context))
    .map(section => ({
      id: section.id,
      name: section.name,
      order: section.order
    }))
    .sort((a, b) => a.order - b.order);
}

export function getDashboardDeclaration(): DashboardDeclaration {
  return POS_DASHBOARD_DECLARATION;
}

export function getSectionById(sectionId: string): DashboardSection | undefined {
  return POS_DASHBOARD_DECLARATION.sections.find(s => s.id === sectionId);
}

export function getDefaultFeatureFlagValues(): Record<string, boolean> {
  return POS_FEATURE_FLAGS.reduce((acc, flag) => {
    acc[flag.id] = flag.defaultValue;
    return acc;
  }, {} as Record<string, boolean>);
}

export function getCapabilityById(id: string): Capability | undefined {
  return POS_CAPABILITIES.find(cap => cap.id === id);
}

export function getEntitlementById(id: string): Entitlement | undefined {
  return POS_ENTITLEMENTS.find(ent => ent.id === id);
}

export function getFeatureFlagById(id: string): FeatureFlag | undefined {
  return POS_FEATURE_FLAGS.find(flag => flag.id === id);
}

export function getCapabilitiesByCategory(category: string): readonly Capability[] {
  return POS_CAPABILITIES.filter(cap => cap.category === category);
}

export function getAllCapabilityIds(): readonly string[] {
  return POS_CAPABILITIES.map(cap => cap.id);
}

export function getEntitlementsByCapability(capabilityId: string): readonly Entitlement[] {
  return POS_ENTITLEMENTS.filter(ent => 
    ent.requiredCapabilities.includes(capabilityId)
  );
}

export function getAllEntitlementIds(): readonly string[] {
  return POS_ENTITLEMENTS.map(ent => ent.id);
}

export function getAllFeatureFlagIds(): readonly string[] {
  return POS_FEATURE_FLAGS.map(flag => flag.id);
}
