import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Users, FolderKanban, CheckCircle2, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { format, subDays } from 'date-fns';
import { cn } from '@/utils/cn';
import type { ApiResponse } from '@/types';

interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: { status: string; count: number }[];
  recentActivity: { id: string; action: string; entity: string; user: { fullName: string; avatarUrl?: string }; project?: { name: string }; createdAt: string }[];
  productivityTrend: { date: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10B981',
  IN_PROGRESS: '#6366F1',
  PENDING: '#F59E0B',
  OVERDUE: '#EF4444',
  ACCEPTED: '#06B6D4',
};

const kpiConfig = [
  { key: 'totalEmployees',  label: 'Team Members',      icon: Users,         color: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
  { key: 'activeProjects',  label: 'Active Projects',   icon: FolderKanban,  color: '#06B6D4', bg: 'rgba(6,182,212,0.15)'  },
  { key: 'completedTasks',  label: 'Tasks Completed',   icon: CheckCircle2,  color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  { key: 'overdueTasks',    label: 'Overdue Tasks',     icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.15)'  },
];

function KpiCard({ label, value, icon: Icon, color, bg, delay }: { label: string; value: number | undefined; icon: React.ElementType; color: string; bg: string; delay: number }) {
  return (
    <div
      className="glass rounded-2xl p-5 card-hover animate-fade-up"
      style={{ animationDelay: `${delay}ms`, borderColor: `${color}20` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/35 mb-2">{label}</p>
          <p className="font-heading font-bold text-3xl text-white">{(value ?? 0).toLocaleString()}</p>
        </div>
        <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload?: { fill?: string } }[] }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const color = entry.payload?.fill ?? '#6366F1';
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-modal bg-card border" style={{ borderColor: `${color}55` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="text-[11px] uppercase tracking-wider text-foreground/50">{entry.name}</span>
      </div>
      <span className="font-heading font-bold text-lg text-foreground">{entry.value}</span>
      <span className="text-[11px] text-foreground/40 ml-1">tasks</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-modal border border-indigo/30 bg-card">
      <p className="text-[11px] text-foreground/45 mb-1">{label}</p>
      <span className="text-lg font-heading font-bold text-foreground">{payload[0].value}</span>
      <span className="text-[11px] text-foreground/40 ml-1">completed</span>
    </div>
  );
}

function ActionBubble({ action }: { action: string }) {
  const map: Record<string, { color: string; label: string }> = {
    CREATE:       { color: 'bg-indigo/20 text-indigo',  label: 'Created'  },
    UPDATE:       { color: 'bg-cyan/20 text-cyan',      label: 'Updated'  },
    STATUS_CHANGE:   { color: 'bg-success/20 text-success', label: 'Status ↑'  },
    ACCEPT_TIMELINE: { color: 'bg-violet/20 text-violet',  label: 'Accepted'  },
    COMMENT:         { color: 'bg-cyan/20 text-cyan',       label: 'Commented' },
    ASSIGN:          { color: 'bg-amber-500/20 text-amber-400', label: 'Assigned' },
    DELETE:       { color: 'bg-danger/20 text-danger',  label: 'Deleted'  },
  };
  const cfg = map[action] ?? { color: 'bg-white/10 text-white/50', label: action };
  return (
    <span className={cn('inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold tracking-wide shrink-0', cfg.color)}>
      {cfg.label}
    </span>
  );
}

export function CompanyDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'company'],
    queryFn: () => api.get<ApiResponse<DashboardStats>>('/dashboard/company').then((r) => r.data.data),
  });

  // Build trend data — normalize API's `count` to `completed` for the chart
  const trendData = (stats?.productivityTrend?.length
    ? stats.productivityTrend.slice(-14).map((d) => ({ date: format(new Date(d.date), 'MMM d'), completed: d.count }))
    : Array.from({ length: 14 }, (_, i) => ({
        date: format(subDays(new Date(), 13 - i), 'MMM d'),
        completed: 0,
      })));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Skeleton className="h-64 rounded-2xl skeleton lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl skeleton lg:col-span-3" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const donutData = stats.tasksByStatus.filter((s) => s.count > 0);
  const derivedTotal = donutData.reduce((sum, s) => sum + s.count, 0);
  const completionRate = derivedTotal > 0 ? Math.round(((stats.completedTasks ?? 0) / derivedTotal) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="font-heading font-bold text-2xl text-white">Company Dashboard</h1>
        <p className="text-sm text-white/35 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} — overview of all projects and tasks
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {kpiConfig.map(({ key, label, icon, color, bg }, i) => (
          <KpiCard
            key={key}
            label={label}
            value={stats[key as keyof DashboardStats] as number}
            icon={icon}
            color={color}
            bg={bg}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Donut — tasks by status */}
        <div className="glass rounded-2xl p-5 lg:col-span-2 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-sm text-white">Tasks by Status</h2>
            <span className="text-xs text-white/35">{derivedTotal} total</span>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  isAnimationActive
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#6366F1'} />
                  ))}
                </Pie>
                <ReTooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="font-heading font-bold text-2xl text-white">{completionRate}%</p>
              <p className="text-[10px] text-white/35">complete</p>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            {donutData.map((s) => (
              <div key={s.status} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[s.status] ?? '#6366F1' }} />
                <span className="text-[11px] text-white/50">{s.status} <span className="text-white/70 font-medium">{s.count}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Area — productivity trend */}
        <div className="glass rounded-2xl p-5 lg:col-span-3 animate-fade-up" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-sm text-white">Productivity Trend</h2>
            <div className="flex items-center gap-1.5 text-xs text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Last 14 days</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <ReTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#areaGrad)"
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity feed */}
      <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '320ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-indigo" />
          <h2 className="font-heading font-semibold text-sm text-white">Recent Activity</h2>
        </div>

        {stats.recentActivity.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-8">No recent activity</p>
        ) : (
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/[0.06]" />
            {stats.recentActivity.map((item, i) => (
              <div
                key={item.id}
                className="flex items-start gap-4 py-3 mb-2 hover:bg-white/[0.02] rounded-xl px-2 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Icon bubble */}
                <div className="relative z-10 h-9 w-9 rounded-full bg-surface border border-white/[0.08] flex items-center justify-center shrink-0 text-xs font-bold text-indigo">
                  {item.user.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white/80">{item.user.fullName}</span>
                    <ActionBubble action={item.action} />
                    <span className="text-sm text-white/40">{item.entity.toLowerCase()}</span>
                    {item.project && (
                      <span className="text-xs text-indigo/70">in {item.project.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/25 mt-0.5">
                    {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
