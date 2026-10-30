import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSocket } from '@/hooks/useSocket';
import { useUIStore } from '@/stores/uiStore';

export function AppLayout() {
  useSocket();
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* ── Desktop sidebar (always visible ≥ md) ── */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex h-full w-64 flex-col animate-slide-in-left">
            <Sidebar />
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-tint/[0.08] text-foreground/50 hover:text-foreground hover:bg-tint/[0.12] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-base">
          <div key={location.pathname} className="page-enter h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
