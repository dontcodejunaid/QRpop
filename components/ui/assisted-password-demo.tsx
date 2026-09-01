'use client';

import React, { useState } from 'react';
import { AssistedPasswordConfirmation } from './assisted-password-confirmation';

export function AssistedPasswordConfirmationDemo() {
  const [password, setPassword] = useState('ui.lndev.me');

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#0a110e] p-6">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-6 rounded-2xl bg-white p-10 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-800">Password Confirmation Demo</h2>
        <div className="w-full">
          <label className="text-xs font-semibold text-slate-500">Initial Password</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none"
            placeholder="Type a password"
          />
        </div>
        <div className="w-full">
          <label className="text-xs font-semibold text-slate-500">Assisted Confirmation</label>
          <AssistedPasswordConfirmation password={password} />
        </div>
      </div>
    </main>
  );
}

export default AssistedPasswordConfirmationDemo;
