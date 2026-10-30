import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Flag, Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { format, isToday, isPast, isFuture, startOfToday } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Task, ApiResponse } from '@/types';

const FILTERS = [
  { key: 'all',       label: 'All Tasks',  icon: CheckSquare },
  { key: 'today',     label: 'Today',      icon: Clock },
  { key: 'overdue',   label: 'Overdue',    icon: AlertTriangle },
  { key: 'upcoming',  label: 'Upcoming',   icon: Calendar },
  { key: 'completed', label: 'Completed',  icon: CheckCircle2 },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-danger/15 text-danger border-danger/25',
  HIGH:     'bg-warning/15 text-warning border-warning/25',
  MEDIUM:   'bg-indigo/15 text-indigo border-indigo/25',
  LOW:      'bg-cyan/15 text-cyan border-cyan/25',
};

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-danger',
  HIGH:     'bg-warning',
  MEDIUM:   'bg-indigo',
  LOW:      'bg-cyan',
};

interface GroupConfig {
  key: string;
  label: string;
  accent: string;
  headerClass: string;
  filter: (t: Task) => boolean;
}

const groups: GroupConfig[] = [
  {
    key: 'overdue',
    label: 'Overdue',
    accent: 'border-danger/40',
    headerClass: 'text-danger',
    filter: (t) => t.status === 'OVERDUE' || (isPast(new Date(t.deadline)) && t.status !== 'COMPLETED'),
  },
  {
    key: 'today',
    label: 'Due Today',
    accent: 'border-warning/40',
    headerClass: 'text-warning',
    filter: (t) => isToday(new Date(t.deadline)) && t.status !== 'COMPLETED',
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
    accent: 'border-indigo/40',
    headerClass: 'text-indigo',
    filter: (t) => isFuture(new Date(t.deadline)) && !isToday(new Date(t.deadline)) && t.status !== 'COMPLETED',
  },
  {
    key: 'completed',
    label: 'Completed',
    accent: 'border-success/30',
    headerClass: 'text-success',
    filter: (t) => t.status === 'COMPLETED',
  },
];

function filterTasks(tasks: Task[], filter: string): Task[] {
  const today = startOfToday();
  switch (filter) {
    case 'today':     return tasks.filter((t) => isToday(new Date(t.deadline)));
    case 'overdue':   return tasks.filter((t) => isPast(new Date(t.deadline)) && t.status !== 'COMPLETED');
    case 'upcoming':  return tasks.filter((t) => isFuture(new Date(t.deadline)) && !isToday(new Date(t.deadline)));
    case 'completed': return tasks.filter((t) => t.status === 'COMPLETED');
    default:          return tasks;
  }
}

function TaskRow({ task }: { task: Task }) {
  const isCompleted = task.status === 'COMPLETED';
  const isOverdue = task.status === 'OVERDUE' || (isPast(new Date(task.deadline)) && !isCompleted);

  return (
    <Link to={`/projects/${task.projectId}/tasks/${task.id}`}>
      <div className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-all group border border-transparent hover:border-white/[0.06]',
        isCompleted && 'opacity-50',
      )}>
        {/* Priority dot */}
        <div className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-white/20')} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-semibold text-white/80 group-hover:text-white transition-colors', isCompleted && 'line-through text-white/35')}>
              {task.title}
            </span>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border', PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS['MEDIUM'])}>
              <Flag className="h-2.5 w-2.5 mr-1" /> {task.priority}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-white/30">
            <span className={cn('font-mono', isOverdue && !isCompleted && 'text-danger/70')}>
              {isCompleted && task.completedAt
                ? `Completed ${format(new Date(task.completedAt), 'MMM d')}`
                : `Due ${format(new Date(task.deadline), 'MMM d, yyyy')}`}
            </span>
            {isCompleted && task.completedAt && new Date(task.completedAt) > new Date(task.deadline) && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-warning/15 text-warning border border-warning/25">
                Completed Late
              </span>
            )}
            {task.projectId && (
              <span className="inline-flex items-center gap-1 bg-white/[0.05] rounded-md px-2 py-0.5 border border-white/[0.07] text-white/40">
                {task.projectId.slice(0, 8)}…
              </span>
            )}
          </div>
        </div>

        {/* Status chip */}
        <div className={cn(
          'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold border shrink-0',
          task.status === 'COMPLETED' ? 'bg-success/10 text-success border-success/20' :
          task.status === 'IN_PROGRESS' ? 'bg-indigo/10 text-indigo border-indigo/20' :
          task.status === 'OVERDUE' ? 'bg-danger/10 text-danger border-danger/20' :
          'bg-white/[0.05] text-white/40 border-white/[0.08]',
        )}>
          {task.status.replace('_', ' ')}
        </div>
      </div>
    </Link>
  );
}

export function MyTasksPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const { user } = useAuthStore();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async (): Promise<Task[]> => {
      const res = await api.get<ApiResponse<{ tasks: Task[] } | Task[]>>('/dashboard/my-tasks');
      const payload = res.data.data;
      // API returns { tasks: [...], byStatus: {...} } — extract the array
      if (Array.isArray(payload)) return payload;
      if (payload && 'tasks' in payload && Array.isArray(payload.tasks)) return payload.tasks;
      return [];
    },
  });

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const filtered = filterTasks(safeTasks, activeFilter);
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="font-heading font-bold text-2xl text-white">
          Good{new Date().getHours() < 12 ? ' morning' : new Date().getHours() < 18 ? ' afternoon' : ' evening'},{' '}
          <span className="text-gradient">{user?.fullName?.split(' ')[0]}</span>
        </h1>
        <p className="text-sm text-white/35 mt-1">{today} · {safeTasks.length} task{safeTasks.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {FILTERS.map(({ key, label, icon: Icon }) => {
          const count = filterTasks(safeTasks, key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                activeFilter === key
                  ? 'bg-gradient-primary text-white shadow-glow-sm'
                  : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/80 border border-white/[0.07]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {count > 0 && (
                <span className={cn('ml-0.5 rounded-full text-[10px] font-bold px-1.5 py-0.5',
                  activeFilter === key ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-white/40')}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl skeleton" />)}
        </div>
      ) : activeFilter !== 'all' ? (
        /* Single filter view */
        <div className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
          {filtered.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center py-16 text-center">
              <CheckSquare className="h-10 w-10 text-white/10 mb-3" />
              <p className="font-heading font-semibold text-white/35">No tasks here</p>
              <p className="text-sm text-white/20 mt-1">
                {activeFilter === 'completed' ? "You haven't completed any tasks yet" : 'Looking good!'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5 stagger">
              {filtered.map((task) => <TaskRow key={task.id} task={task} />)}
            </div>
          )}
        </div>
      ) : (
        /* Grouped view */
        <div className="space-y-5 stagger">
          {groups.map((group) => {
            const groupTasks = safeTasks.filter(group.filter);
            if (groupTasks.length === 0) return null;
            return (
              <div key={group.key} className="animate-fade-in">
                <div className={cn('flex items-center gap-2 mb-2.5 px-1', group.headerClass)}>
                  <div className={cn('h-px flex-1 opacity-30', group.accent.replace('border-', 'bg-'))} />
                  <span className="text-xs font-bold uppercase tracking-widest">{group.label}</span>
                  <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold text-white/40">{groupTasks.length}</span>
                  <div className={cn('h-px flex-1 opacity-30', group.accent.replace('border-', 'bg-'))} />
                </div>
                <div className={cn('glass rounded-2xl overflow-hidden border-l-2', group.accent)}>
                  <div className="p-2 space-y-0.5 stagger">
                    {groupTasks.map((task) => <TaskRow key={task.id} task={task} />)}
                  </div>
                </div>
              </div>
            );
          })}
          {safeTasks.length === 0 && !isLoading && (
            <div className="flex flex-col items-center py-24 text-center animate-fade-up">
              <CheckSquare className="h-12 w-12 text-white/10 mb-4" />
              <p className="font-heading font-semibold text-white/35 text-lg">No tasks assigned yet</p>
              <p className="text-sm text-white/20 mt-1">When tasks are assigned to you, they'll appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
