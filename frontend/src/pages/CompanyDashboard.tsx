import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Planner, PlannerLegend } from '@/components/planner/Planner';
import { planWindow, taskRow, taskState } from '@/components/planner/plan';
import { api } from '@/api/axios';
import { format } from 'date-fns';
import type { ApiResponse, Project, Task } from '@/types';

interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: { status: string; count: number }[];
  recentActivity: { id: string; action: string; entity: string; user: { fullName: string }; project?: { name: string }; createdAt: string }[];
}

const VERB: Record<string, string> = {
  CREATE: 'added a',
  UPDATE: 'changed a',
  STATUS_CHANGE: 'moved a',
  ACCEPT_TIMELINE: 'agreed to the dates on a',
  ACCEPT: 'accepted a',
  INVITE: 'sent a',
  ARCHIVE: 'archived a',
  REMOVE_MEMBER: 'removed a',
};

export function CompanyDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'company'],
    queryFn: () => api.get<ApiResponse<DashboardStats>>('/dashboard/company').then((r) => r.data.data),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<ApiResponse<Project[]>>('/projects').then((r) => r.data.data),
  });
  const active = projects.filter((p) => p.status === 'ACTIVE');
  const taskQueries = useQueries({
    queries: active.map((p) => ({
      queryKey: ['tasks', p.id],
      queryFn: () => api.get<ApiResponse<Task[]>>(`/projects/${p.id}/tasks`).then((r) => r.data.data),
    })),
  });

  const allTasks = useMemo(() => taskQueries.flatMap((q) => q.data ?? []), [taskQueries]);
  const span = useMemo(() => planWindow(allTasks), [allTasks]);
  const inPencil = allTasks.filter((t) => taskState(t) === 'pencil').length;

  if (isLoading || !stats) {
    return (
      <div className="space-y-5 p-6">
        <Skeleton className="skeleton h-40 w-full" />
        <Skeleton className="skeleton h-96 w-full" />
      </div>
    );
  }

  const tally = [
    ['Open projects', stats.activeProjects],
    ['People', stats.totalEmployees],
    ['In pencil', inPencil],
    ['Past deadline', stats.overdueTasks],
    ['Done', stats.completedTasks],
  ] as const;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="sheet px-4 pb-6 pt-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-print pb-2">
          <h1 className="print-head text-[clamp(36px,5vw,64px)]">The whole wall</h1>
          <p className="font-heading text-[15px] font-medium uppercase tracking-[.07em] text-muted-foreground">{format(new Date(), 'EEEE d MMMM yyyy')}</p>
        </div>
        <dl className="mt-1 grid grid-cols-2 sm:grid-cols-5">
          {tally.map(([label, value]) => (
            <div key={label} className="border-b border-rule py-3 pr-3 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
              <dt className="field-label">{label}</dt>
              <dd className={`print-head text-[44px] ${label === 'Past deadline' && value > 0 ? 'text-danger' : label === 'In pencil' && value > 0 ? 'text-pen' : ''}`}>{value}</dd>
            </div>
          ))}
        </dl>
        {(stats.overdueTasks > 0 || inPencil > 0) && (
          <p className="hand mt-3 text-[23px] leading-tight text-pen">
            {[
              stats.overdueTasks > 0 && `${stats.overdueTasks} ${stats.overdueTasks === 1 ? 'task is' : 'tasks are'} past the deadline`,
              inPencil > 0 && `${inPencil} still waiting for someone to agree`,
            ].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {active.map((p, i) => {
        const tasks = taskQueries[i]?.data;
        return (
          <div key={p.id} className="sheet px-4 pb-5 pt-5 sm:px-8">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b-2 border-print pb-1.5">
              <h2 className="print-head text-[30px]">{p.name}</h2>
              <Link to={`/projects/${p.id}`} className="text-sm font-semibold underline underline-offset-2">Open the project</Link>
            </div>
            {!tasks ? (
              <Skeleton className="skeleton h-48 w-full" />
            ) : tasks.length === 0 ? (
              <p className="hand py-6 text-[22px] text-graphite">nothing pencilled in yet</p>
            ) : (
              <Planner rows={tasks.map((t) => taskRow(t, `/projects/${p.id}/tasks/${t.id}`))} from={span.from} weeks={span.weeks} />
            )}
          </div>
        );
      })}
      {active.length > 0 && <div className="px-1"><PlannerLegend /></div>}

      <div className="sheet px-4 py-5 sm:px-8">
        <h2 className="print-head border-b-2 border-print pb-1.5 text-[30px]">Logbook</h2>
        {stats.recentActivity.length === 0 ? (
          <p className="hand py-6 text-[22px] text-graphite">nothing has happened yet</p>
        ) : (
          <ul className="divide-y divide-rule">
            {stats.recentActivity.map((item) => (
              <li key={item.id} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
                <span className="shrink-0 font-mono text-[12px] text-muted-foreground sm:w-32 sm:pt-0.5">{format(new Date(item.createdAt), 'd MMM, HH:mm')}</span>
                <span className="text-sm">
                  <b className="font-semibold">{item.user.fullName}</b> {VERB[item.action] ?? item.action.toLowerCase().replace('_', ' ')} {item.entity.toLowerCase()}
                  {item.project && <span className="text-muted-foreground"> in {item.project.name}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
