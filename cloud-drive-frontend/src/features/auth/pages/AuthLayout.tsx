import React from 'react';

export function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-100 shadow-soft p-6">
        <div className="mb-5">
          <div className="text-sm font-semibold text-blue-600">Cloud Drive</div>
          <h1 className="text-2xl font-semibold mt-1">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
