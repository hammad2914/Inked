import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare,
  BarChart3, Settings, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard, roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Team',       href: '/team',       icon: Users,           roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Projects',   href: '/projects',   icon: FolderKanban,    roles: ['COMPANY_ADMIN', 'SUPER_ADMIN', 'MEMBER'] },
  { label: 'My Tasks',   href: '/my-tasks',   icon: CheckSquare,     roles: ['COMPANY_ADMIN', 'SUPER_ADMIN', 'MEMBER'] },
  { label: 'Reports',    href: '/reports',    icon: BarChart3,       roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Settings',   href: '/settings',   icon: Settings,        roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
];

const roleLabel: Record<string, string> = {
  COMPANY_ADMIN: 'Admin',
  SUPER_ADMIN:   'Super Admin',
  MEMBER:        'Member',
};

export function Sidebar() {
  const { user, company } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();

  const visibleNav = navItems.filter((item) => user && item.roles.includes(user.role));
  const initials = user?.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '';

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col transition-all duration-300 ease-in-out',
        'border-r border-border bg-sidebar',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* ── Logo ── */}
      <div className={cn(
        'flex h-16 items-center border-b border-border px-3 shrink-0',
        sidebarOpen ? 'justify-between' : 'justify-center',
      )}>
        {sidebarOpen && (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow-sm shrink-0">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground tracking-tight">Taskify</span>
          </div>
        )}
        {!sidebarOpen && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow-sm">
            <Zap className="h-4 w-4 text-white" fill="white" />
          </div>
        )}
      </div>

      {/* ── Company pill ── */}
      {sidebarOpen && company && (
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-lg bg-tint/[0.04] border border-border px-3 py-2 animate-fade-in">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo/20 shrink-0">
            <span className="text-[10px] font-mono font-bold text-indigo">{company.name.charAt(0)}</span>
          </div>
          <span className="text-xs font-medium text-foreground/70 truncate">{company.name}</span>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleNav.map((item, i) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              to={item.href}
              title={!sidebarOpen ? item.label : undefined}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                'transition-all duration-150 animate-fade-in',
                isActive
                  ? 'bg-indigo/15 text-indigo border-l-[3px] border-indigo pl-[9px] shadow-glow-sm'
                  : 'text-foreground/50 hover:bg-tint/[0.05] hover:text-foreground/90 border-l-[3px] border-transparent pl-[9px]',
                !sidebarOpen && 'justify-center px-2 pl-2 border-l-0',
              )}
            >
              <item.icon className={cn(
                'h-[18px] w-[18px] shrink-0 transition-all',
                isActive ? 'text-indigo drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]' : 'text-current',
              )} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Collapse toggle ── */}
      <div className="px-2 pb-2">
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-foreground/30',
            'hover:bg-tint/[0.05] hover:text-foreground/60 transition-all duration-150',
            !sidebarOpen && 'justify-center px-2',
          )}
        >
          {sidebarOpen ? (
            <><ChevronLeft className="h-4 w-4 shrink-0" /><span>Collapse</span></>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
      </div>

      {/* ── User footer ── */}
      {user && (
        <div className={cn(
          'border-t border-border p-3 flex items-center gap-3',
          !sidebarOpen && 'justify-center p-3',
        )}>
          <div className="relative shrink-0">
            <Avatar className="h-8 w-8 ring-2 ring-indigo/30">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-gradient-primary text-white text-xs font-heading font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-sidebar glow-success" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <p className="text-xs font-semibold text-foreground/85 truncate">{user.fullName}</p>
              <p className="text-[10px] text-foreground/40 truncate">{roleLabel[user.role] ?? user.role}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
