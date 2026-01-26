import { withAuthGuard } from '@webwaka/core-auth-ui/middleware';

export default withAuthGuard();

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (authentication page)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico, /manifest.json (metadata files)
     * - /api/public (public API routes)
     */
    '/((?!login|_next/static|_next/image|favicon.ico|manifest.json|api/public).*)',
  ],
};
