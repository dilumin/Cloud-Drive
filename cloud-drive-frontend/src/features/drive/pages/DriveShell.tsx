import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';
import { useAuth } from '../../auth/auth-context';
import { Button } from '../../../shared/ui/Button';

export function DriveShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  async function onLogout() {
    await logout();
    nav('/login', { replace: true });
  }

  return (
    <div className="min-h-screen grid grid-cols-[280px_1fr]">
      <aside className="border-r border-zinc-100 bg-white p-4 flex flex-col">
        <Link to="/drive" className="block">
          <div className="text-sm font-semibold text-blue-600">Cloud Drive</div>
          <div className="text-xs text-zinc-500 mt-1">BFF + Microservices</div>
        </Link>

        <div className="mt-6">
          <div className="text-xs font-semibold text-zinc-500 mb-2">Navigation</div>
          <nav className="space-y-1">
            <Link className="block px-3 py-2 rounded-xl hover:bg-zinc-100 text-sm" to="/drive">
              My Drive
            </Link>
          </nav>
        </div>

        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-zinc-100 p-3">
            <div className="text-xs text-zinc-500">Signed in as</div>
            <div className="text-sm font-medium truncate">{user?.email || '—'}</div>
            <Button className="mt-3 w-full" variant="ghost" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 w-full max-w-xl bg-white border border-zinc-100 rounded-2xl px-4 h-11 shadow-soft">
            <Search className="w-4 h-4 text-zinc-500" />
            <input className="w-full outline-none text-sm" placeholder="Search (coming soon)" disabled />
          </div>
          <div className="ml-4 text-xs text-zinc-500 hidden md:block">Minimal Google Drive-like UI</div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
