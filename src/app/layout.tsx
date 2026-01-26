import type { Metadata, Viewport } from 'next';
import { ClerkAuthProvider } from '@webwaka/core-auth-ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebWaka POS',
  description: 'Point of Sale System - WebWaka Suite',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a2e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkAuthProvider>
      <html lang="en">
        <body className="bg-pos-dark text-white antialiased">
          {children}
        </body>
      </html>
    </ClerkAuthProvider>
  );
}
