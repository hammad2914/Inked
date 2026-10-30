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
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, setMobileNavOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <div className="hidden h-full shrink-0 md:flex">
        <Sidebar />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-print/40" onClick={() => setMobileNavOpen(false)} />
          <div className="relative flex h-full w-64 flex-col animate-slide-in-left">
            <Sidebar expanded />
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close the menu"
              className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-[3px] text-muted-foreground hover:bg-print/[0.06] hover:text-print"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-base">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
