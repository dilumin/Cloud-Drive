import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-soft p-6 border border-zinc-100">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-zinc-600 mt-2">The page you are looking for doesn’t exist.</p>
        <Link className="inline-flex mt-4 text-sm font-medium text-blue-600 hover:underline" to="/drive">
          Go to Drive
        </Link>
      </div>
    </div>
  );
}
