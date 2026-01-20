const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^webwaka-suite-pos-control/src/capabilities$': '<rootDir>/src/__mocks__/webwaka-suite-pos-control.ts',
    '^webwaka-suite-pos-control/src/entitlements$': '<rootDir>/src/__mocks__/webwaka-suite-pos-control.ts',
    '^webwaka-suite-pos-control/src/featureFlags$': '<rootDir>/src/__mocks__/webwaka-suite-pos-control.ts',
    '^webwaka-suite-pos-control/src/dashboard/pos.dashboard$': '<rootDir>/src/__mocks__/webwaka-suite-pos-control.ts',
    '^webwaka-suite-pos-control/src/types$': '<rootDir>/src/__mocks__/webwaka-suite-pos-control.ts',
    '^webwaka-core-dashboard-control/src/engine/resolver$': '<rootDir>/src/__mocks__/webwaka-core-dashboard-control.ts',
    '^webwaka-core-dashboard-control/src/engine/snapshot$': '<rootDir>/src/__mocks__/webwaka-core-dashboard-control.ts',
    '^webwaka-core-dashboard-control/src/models/schemas$': '<rootDir>/src/__mocks__/webwaka-core-dashboard-control.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
