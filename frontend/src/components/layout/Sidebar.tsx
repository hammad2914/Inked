import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare,
  BarChart3, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard, roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Projects',   href: '/projects',   icon: FolderKanban,    roles: ['COMPANY_ADMIN', 'SUPER_ADMIN', 'MEMBER'] },
  { label: 'My tasks',   href: '/my-tasks',   icon: CheckSquare,     roles: ['COMPANY_ADMIN', 'SUPER_ADMIN', 'MEMBER'] },
  { label: 'Team',       href: '/team',       icon: Users,           roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Reports',    href: '/reports',    icon: BarChart3,       roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Settings',   href: '/settings',   icon: Settings,        roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
];

const roleLabel: Record<string, string> = {
  COMPANY_ADMIN: 'Admin',
  SUPER_ADMIN:   'Super admin',
  MEMBER:        'Member',
};

export function Sidebar({ expanded = false }: { expanded?: boolean }) {
  const { user, company } = useAuthStore();
  const { sidebarOpen: storedOpen, toggleSidebar } = useUIStore();
  const sidebarOpen = expanded || storedOpen;
  const location = useLocation();

  const visibleNav = navItems.filter((item) => user && item.roles.includes(user.role));
  const initials = user?.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '';

  return (
    <aside className={cn(
      'relative flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300',
      sidebarOpen ? 'w-60' : 'w-16',
    )}>
      <div className={cn('flex h-16 shrink-0 items-center px-4', !sidebarOpen && 'justify-center px-0')}>
        <Link to="/" className="flex items-center gap-2 font-heading text-[23px] font-bold tracking-[.03em]">
          <i className="inline-block h-3.5 w-3.5 rounded-full bg-pen" />
          {sidebarOpen && 'INKED'}
        </Link>
      </div>

      {sidebarOpen && company && (
        <div className="mx-4 mb-3 border-b-[3px] border-print pb-2">
          <p className="font-heading text-[13px] font-semibold uppercase tracking-[.08em] text-muted-foreground">Planner of</p>
          <p className="truncate font-heading text-xl font-bold uppercase leading-tight">{company.name}</p>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
        {visibleNav.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              to={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-[3px] px-3 py-2 text-[15px] font-medium transition-colors',
                isActive ? 'bg-print text-paper' : 'text-print/70 hover:bg-print/[0.06] hover:text-print',
                !sidebarOpen && 'justify-center px-2',
              )}
            >
              <item.icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2">
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex w-full items-center gap-3 rounded-[3px] px-3 py-2 text-xs text-muted-foreground hover:bg-print/[0.06] hover:text-print',
            !sidebarOpen && 'justify-center px-2',
          )}
        >
          {sidebarOpen ? <><ChevronLeft className="h-4 w-4 shrink-0" /><span>Fold away</span></> : <ChevronRight className="h-4 w-4 shrink-0" />}
        </button>
      </div>

      {user && (
        <div className={cn('flex items-center gap-3 border-t border-sidebar-border p-3', !sidebarOpen && 'justify-center')}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-print font-heading text-sm font-bold text-paper">
            {initials}
          </span>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{user.fullName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{roleLabel[user.role] ?? user.role}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
