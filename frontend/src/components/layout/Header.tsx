import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, Sun, Moon, LogOut, User, Menu, CheckCheck,
  Search, ChevronRight, Command, FolderKanban, CheckSquare,
  LayoutDashboard, Users, BarChart3, Settings, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useSocketStore } from '@/stores/socketStore';
import { api } from '@/api/axios';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Notification } from '@/types';

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const breadcrumbMap: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/team':        'Team',
  '/projects':    'Projects',
  '/my-tasks':    'My Tasks',
  '/reports':     'Reports',
  '/settings':    'Settings',
  '/settings/hr': 'HR Integration',
};

const commandItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard',   group: 'Pages' },
  { icon: Users,           label: 'Team',          href: '/team',        group: 'Pages' },
  { icon: FolderKanban,   label: 'Projects',       href: '/projects',    group: 'Pages' },
  { icon: CheckSquare,    label: 'My Tasks',       href: '/my-tasks',    group: 'Pages' },
  { icon: BarChart3,      label: 'Reports',        href: '/reports',     group: 'Pages' },
  { icon: Settings,       label: 'Settings',       href: '/settings',    group: 'Pages' },
  { icon: User,           label: 'HR Integration', href: '/settings/hr', group: 'Pages' },
];

function Breadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [];
  let path = '';
  for (const part of parts) {
    path += `/${part}`;
    const label = breadcrumbMap[path] ?? (part.length > 20 ? `${part.slice(0, 8)}…` : part);
    crumbs.push({ label, href: path });
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-foreground/20" />}
          <span className={cn(
            i === crumbs.length - 1
              ? 'font-semibold text-foreground/80'
              : 'text-foreground/35 hover:text-foreground/60 cursor-pointer transition-colors',
          )}>
            {crumb.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();

  const filtered = commandItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => { setActiveIdx(0); }, [query]);

  const select = useCallback((href: string) => {
    navigate(href);
    onClose();
    setQuery('');
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && filtered[activeIdx]) select(filtered[activeIdx].href);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, filtered, activeIdx, select, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass-elevated rounded-2xl shadow-modal animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="h-4 w-4 text-foreground/40 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, features…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none"
          />
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground/60 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-foreground/30">No results found</div>
          ) : (
            <>
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">Pages</p>
              {filtered.map((item, i) => (
                <button
                  key={item.href}
                  onClick={() => select(item.href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                    i === activeIdx
                      ? 'bg-indigo/20 text-indigo'
                      : 'text-foreground/60 hover:bg-tint/[0.05] hover:text-foreground/90',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-indigo" />
                  {item.label}
                </button>
              ))}
            </>
          )}
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-foreground/25">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, setSidebarOpen } = useUIStore();
  const { unreadCount, setUnreadCount } = useSocketStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<{ data: NotificationsResponse }>('/notifications?limit=15').then((r) => r.data.data),
    enabled: !!user,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const notifications = notifData?.notifications ?? [];
  const displayCount  = unreadCount > 0 ? unreadCount : (notifData?.unreadCount ?? 0);
  const initials = user?.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '';

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <header className="flex h-14 items-center justify-between px-4 md:px-5 border-b border-border backdrop-blur-xl bg-base/80 sticky top-0 z-30 shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="icon"
            className="md:hidden h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-tint/[0.06] rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="hidden md:block"><Breadcrumb /></div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Search chip */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg bg-tint/[0.04] border border-border text-xs text-foreground/35 hover:bg-tint/[0.07] hover:text-foreground/60 transition-all"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <span className="flex items-center gap-0.5 ml-1">
              <Command className="h-3 w-3" />
              <span>K</span>
            </span>
          </button>

          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"
                className="relative h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-tint/[0.06] rounded-lg">
                <Bell className="h-4 w-4" />
                {displayCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo text-[9px] font-bold text-white animate-pulse-glow">
                    {displayCount > 9 ? '9+' : displayCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 glass-elevated border-border rounded-xl shadow-modal" forceMount>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-heading font-semibold text-sm text-foreground">Notifications</span>
                {displayCount > 0 && (
                  <Button variant="ghost" size="sm"
                    className="h-7 text-xs text-indigo hover:text-indigo hover:bg-indigo/10"
                    onClick={() => markAllMutation.mutate()}>
                    <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <Bell className="h-8 w-8 text-foreground/15 mb-2" />
                    <p className="text-sm text-foreground/30">No notifications</p>
                  </div>
                ) : notifications.map((n, i) => (
                  <div key={n.id}>
                    <button
                      className={cn('w-full text-left px-4 py-3 hover:bg-tint/[0.04] transition-colors flex items-start gap-3', !n.isRead && 'bg-indigo/[0.06]')}
                      onClick={() => { if (!n.isRead) markOneMutation.mutate(n.id); if (n.link) navigate(n.link); }}
                    >
                      <div className="mt-1.5 shrink-0">
                        <div className={cn('h-1.5 w-1.5 rounded-full', !n.isRead ? 'bg-indigo' : 'bg-transparent')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm leading-snug', !n.isRead ? 'font-semibold text-foreground' : 'text-foreground/60')}>{n.title}</p>
                        <p className="text-xs text-foreground/35 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-foreground/20 mt-1">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
                      </div>
                    </button>
                    {i < notifications.length - 1 && <Separator className="bg-border" />}
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-tint/[0.06] rounded-lg">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-indigo/40 transition-all">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs font-heading font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 glass-elevated border-border rounded-xl shadow-modal" align="end" forceMount>
                <DropdownMenuLabel className="font-normal px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                  <p className="text-xs text-foreground/35 mt-0.5">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => navigate('/settings')}
                  className="text-foreground/70 hover:text-foreground hover:bg-tint/[0.06] rounded-lg mx-1 cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="text-danger hover:text-danger hover:bg-danger/10 rounded-lg mx-1 mb-1 cursor-pointer"
                  onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    </>
  );
}
