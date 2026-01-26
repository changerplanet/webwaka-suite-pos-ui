'use client';

import { SignIn } from '@webwaka/core-auth-ui';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pos-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">WebWaka POS</h1>
          <p className="text-gray-400">Point of Sale System</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
