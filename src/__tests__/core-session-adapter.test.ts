/**
 * Core Session Adapter Tests
 * 
 * Verifies Phase D-3.1 implementation:
 * - Core session resolution works when online
 * - Cached session is used when offline
 * - No business data is written to Core
 * - Offline functionality is preserved
 */

import {
  fetchCoreSession,
  fetchTenantDetails,
  loadCachedCoreSession,
  cacheCoreSession,
  clearCachedCoreSession,
  resolveCoreSessionContext,
  isOnline,
} from '../lib/core-session-adapter';

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('Core Session Adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.navigator as any).onLine = true;
  });

  describe('fetchCoreSession', () => {
    it('should fetch session from Core API when online', async () => {
      const mockSession = {
        userId: 'user_123',
        tenantId: 'tenant_demo',
        partnerId: 'partner_001',
        username: 'testuser',
        roles: ['pos:clerk'],
        expiresAt: Date.now() + 3600000,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      });

      const result = await fetchCoreSession();
      expect(result).toEqual(mockSession);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/session'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should return null when Core API is unreachable', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchCoreSession();
      expect(result).toBeNull();
    });

    it('should return null when Core API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await fetchCoreSession();
      expect(result).toBeNull();
    });
  });

  describe('fetchTenantDetails', () => {
    it('should fetch tenant details from Core API', async () => {
      const mockTenant = {
        id: 'tenant_demo',
        name: 'Demo Tenant',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTenant,
      });

      const result = await fetchTenantDetails();
      expect(result).toEqual(mockTenant);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tenants/mine'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });
  });

  describe('Session Caching', () => {
    it('should cache session to localStorage', () => {
      const mockSession = {
        userId: 'user_123',
        tenantId: 'tenant_demo',
        partnerId: 'partner_001',
        username: 'testuser',
        roles: ['pos:clerk'],
        expiresAt: Date.now() + 3600000,
      };

      cacheCoreSession(mockSession);

      const cached = loadCachedCoreSession();
      expect(cached).toEqual(mockSession);
    });

    it('should return null for expired cached session', () => {
      const expiredSession = {
        userId: 'user_123',
        tenantId: 'tenant_demo',
        partnerId: 'partner_001',
        username: 'testuser',
        roles: ['pos:clerk'],
        expiresAt: Date.now() - 1000, // Expired
      };

      cacheCoreSession(expiredSession);

      const cached = loadCachedCoreSession();
      expect(cached).toBeNull();
    });

    it('should clear cached session', () => {
      const mockSession = {
        userId: 'user_123',
        tenantId: 'tenant_demo',
        partnerId: 'partner_001',
        username: 'testuser',
        roles: ['pos:clerk'],
        expiresAt: Date.now() + 3600000,
      };

      cacheCoreSession(mockSession);
      clearCachedCoreSession();

      const cached = loadCachedCoreSession();
      expect(cached).toBeNull();
    });
  });

  describe('resolveCoreSessionContext', () => {
    it('should fetch fresh session when online', async () => {
      const mockSession = {
        userId: 'user_123',
        tenantId: 'tenant_demo',
        partnerId: 'partner_001',
        username: 'testuser',
        roles: ['pos:clerk'],
        expiresAt: Date.now() + 3600000,
      };

      (global.navigator as any).onLine = true;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      });

      const result = await resolveCoreSessionContext();
      expect(result).toEqual(mockSession);
    });

    it('should use cached session when offline', async () => {
      const mockSession = {
        userId: 'user_123',
        tenantId: 'tenant_demo',
        partnerId: 'partner_001',
        username: 'testuser',
        roles: ['pos:clerk'],
        expiresAt: Date.now() + 3600000,
      };

      cacheCoreSession(mockSession);
      (global.navigator as any).onLine = false;

      const result = await resolveCoreSessionContext();
      expect(result).toEqual(mockSession);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null when offline and no cached session', async () => {
      (global.navigator as any).onLine = false;

      const result = await resolveCoreSessionContext();
      expect(result).toBeNull();
    });
  });

  describe('Offline Guarantees', () => {
    it('should not make network requests when offline', async () => {
      (global.navigator as any).onLine = false;

      await resolveCoreSessionContext();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should gracefully handle network failures', async () => {
      (global.navigator as any).onLine = true;
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await resolveCoreSessionContext();
      expect(result).toBeNull();
    });
  });

  describe('Phase D-3.1 Compliance', () => {
    it('should only make READ requests to Core API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await fetchCoreSession();
      
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].method).toBe('GET');
    });

    it('should not write business data to Core', async () => {
      // This test verifies that the adapter only makes GET requests
      // and does not POST/PUT/PATCH any business data
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await fetchCoreSession();
      await fetchTenantDetails();

      const allCalls = (global.fetch as jest.Mock).mock.calls;
      allCalls.forEach(call => {
        expect(call[1].method).toBe('GET');
      });
    });
  });
});
