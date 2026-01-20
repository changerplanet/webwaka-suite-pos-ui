# WebWaka POS UI

## Overview
WebWaka Suite Module for Point of Sale UI. This is a mobile-first, offline-first PWA designed to be a pure consumer of the WebWaka core and control layers.

**Module ID**: webwaka_suite_pos_ui
**Class**: suite
**Status**: Development

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Offline Storage**: IndexedDB via Dexie
- **Testing**: Jest + React Testing Library

## Project Structure
```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with PWA metadata
│   │   ├── page.tsx            # Main POS page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── CartView.tsx        # Shopping cart display
│   │   ├── CheckoutModal.tsx   # Payment processing modal
│   │   ├── DashboardRenderer.tsx # Dynamic dashboard sections
│   │   ├── LoginForm.tsx       # User authentication
│   │   ├── ProductGrid.tsx     # Product catalog grid
│   │   ├── ReceiptView.tsx     # Receipt display
│   │   ├── ShiftManager.tsx    # Shift open/close
│   │   └── SyncIndicator.tsx   # Online/offline status
│   ├── hooks/                  # Custom React hooks
│   │   ├── useCart.ts          # Cart state management
│   │   ├── useProducts.ts      # Product catalog
│   │   ├── useSession.ts       # User session
│   │   ├── useShift.ts         # Shift management
│   │   └── useSync.ts          # Sync status
│   ├── lib/                    # Core libraries
│   │   ├── control-consumer.ts # Control layer consumption
│   │   ├── db.ts               # IndexedDB schema (Dexie)
│   │   └── sync-manager.ts     # Offline sync queue
│   ├── types/                  # TypeScript types
│   │   └── core.ts             # Core type definitions
│   └── __tests__/              # Test files
├── public/                     # Static assets
│   └── manifest.json           # PWA manifest
├── package.json
├── next.config.js
├── tailwind.config.js
└── jest.config.js
```

## Running the Application
- **Development**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Production**: `npm start`
- **Tests**: `npm test`
- **Coverage**: `npm run test:coverage`

## Architectural Principles

### 1. Pure Consumer Pattern
This UI does NOT implement business logic. All visibility, permissions, entitlements, and feature flags are consumed from:
- `webwaka-suite-pos-control`
- `webwaka-core-dashboard-control`

### 2. Offline-First
- All data stored in IndexedDB via Dexie
- Events queued when offline
- Deterministic sync when online
- Works in airplane mode

### 3. No Business Logic
- UI emits events
- Ledger computes truth
- Payments via Core Payments
- Receipts via Core Receipts

## UI Screens Implemented
1. Login / Session bootstrap
2. POS Home / Dashboard
3. Product Search & Quick Sale
4. Cart
5. Checkout
6. Receipt View
7. Shift Open / Close
8. Offline / Sync Status Indicator

## Module Dependencies
- webwaka-suite-pos-control (capabilities, entitlements, feature flags)
- webwaka-core-inventory (product availability)
- webwaka-core-ledger (transaction recording)
- webwaka-core-payments (payment processing)
- webwaka-core-receipts (receipt generation)
- webwaka-core-dashboard-control (dashboard sections)

## Constitutional Compliance (Phase 5B)

### Control Packages Installed
- `webwaka-suite-pos-control` (GitHub: changerplanet/webwaka-suite-pos-control)
- `webwaka-core-dashboard-control` (GitHub: changerplanet/webwaka-core-dashboard-control)

### Control Consumption Paths
- `src/lib/control-consumer.ts` - Imports from control packages
  - POS_CAPABILITIES from `webwaka-suite-pos-control/src/capabilities`
  - POS_ENTITLEMENTS from `webwaka-suite-pos-control/src/entitlements`
  - POS_FEATURE_FLAGS from `webwaka-suite-pos-control/src/featureFlags`
  - POS_DASHBOARD_DECLARATION from `webwaka-suite-pos-control/src/dashboard/pos.dashboard`
  - resolveVisibleSections from `webwaka-suite-pos-control`
  - resolveDashboard from `webwaka-core-dashboard-control/src/engine/resolver`
- `src/components/DashboardRenderer.tsx` - Consumes resolved dashboard via resolvePOSDashboard()
- `src/hooks/useSession.ts` - Session creation uses control package declarations

### Runtime Mock Status
- NO runtime mocks in application code
- Mocks exist ONLY in `src/__mocks__/` for Jest test boundary

## Recent Changes
- 2026-01-20: Initial implementation of POS UI
- 2026-01-20: Added offline-first sync manager
- 2026-01-20: Implemented all core UI screens
- 2026-01-20: Added comprehensive test suite (65/65 tests passing)
- 2026-01-20: Fixed forceSync typo in sync manager
- 2026-01-20: Configured deployment for autoscale
- 2026-01-20: **Phase 5B Remediation** - Enforced constitutional control consumption
