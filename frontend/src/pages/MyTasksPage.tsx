import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Planner, PlannerLegend } from '@/components/planner/Planner';
import { planWindow, taskRow, taskState } from '@/components/planner/plan';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import type { Task, ApiResponse } from '@/types';

export function MyTasksPage() {
  const { user } = useAuthStore();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async (): Promise<Task[]> => {
      const res = await api.get<ApiResponse<{ tasks: Task[] } | Task[]>>('/dashboard/my-tasks');
      const payload = res.data.data;
      // the API returns { tasks, byStatus }; older builds returned the array
      if (Array.isArray(payload)) return payload;
      if (payload && 'tasks' in payload && Array.isArray(payload.tasks)) return payload.tasks;
      return [];
    },
  });

  const span = useMemo(() => planWindow(tasks), [tasks]);
  const waiting = tasks.filter((t) => taskState(t) === 'pencil');
  const open = tasks.filter((t) => t.status !== 'COMPLETED');
  const href = (t: Task) => `/projects/${t.projectId}/tasks/${t.id}`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="sheet px-4 pb-6 pt-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-print pb-2">
          <h1 className="print-head text-[clamp(36px,5vw,60px)]">{user?.fullName.split(' ')[0]}'s sheet</h1>
          <p className="font-heading text-[15px] font-medium uppercase tracking-[.07em] text-muted-foreground">
            {open.length} open · {format(new Date(), 'EEE d MMM')}
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="skeleton mt-4 h-60 w-full" />
        ) : tasks.length === 0 ? (
          <p className="hand py-14 text-center text-[26px] text-graphite">nothing assigned to you yet</p>
        ) : (
          <>
            {waiting.length > 0 && (
              <div className="mt-4 rounded-[3px] bg-pen/[0.05] px-4 py-3">
                <p className="hand text-[24px] leading-tight text-pen">
                  {waiting.length === 1 ? 'one task is' : `${waiting.length} tasks are`} waiting for you to agree to the dates
                </p>
                <ul className="mt-2 space-y-1">
                  {waiting.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                      <Link to={href(t)} className="font-semibold underline underline-offset-2 hover:text-pen">{t.title}</Link>
                      <span className="font-mono text-xs text-muted-foreground">
                        {format(new Date(t.startDate), 'd MMM')} – {format(new Date(t.deadline), 'd MMM yyyy')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4">
              <Planner rows={tasks.map((t) => ({ ...taskRow(t, href(t)), sub: `${t.priority.toLowerCase()} priority · ${taskRow(t).sub}` }))} from={span.from} weeks={span.weeks} />
              <PlannerLegend />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
