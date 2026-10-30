import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Planner, PlannerLegend } from '@/components/planner/Planner';
import { planWindow, stateLabel, taskRow, taskState } from '@/components/planner/plan';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Project, Task, User, ApiResponse } from '@/types';

type View = 'planner' | 'list' | 'members';

const STATE_COLOR = { pencil: 'text-graphite', ink: 'text-pen', done: 'text-pen/60', late: 'text-danger' } as const;

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<View>('planner');
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', priority: 'MEDIUM', startDate: '', deadline: '' });
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<ApiResponse<Project>>(`/projects/${id}`).then((r) => r.data.data),
  });
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get<ApiResponse<Task[]>>(`/projects/${id}/tasks`).then((r) => r.data.data),
  });
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => api.get<{ data: User[] }>('/users?limit=100').then((r) => r.data.data),
  });

  const errorToast = (err: unknown) => {
    const e = err as { response?: { data?: { message?: string } } };
    toast({ variant: 'destructive', title: 'That did not save', description: e.response?.data?.message ?? 'Try again.' });
  };

  const createTaskMutation = useMutation({
    mutationFn: () => api.post(`/projects/${id}/tasks`, {
      ...taskForm,
      startDate: new Date(taskForm.startDate).toISOString(),
      deadline:  new Date(taskForm.deadline).toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      toast({ title: 'Pencilled in', description: 'The assignee has been asked to agree to the dates.' });
      setCreateTaskOpen(false);
      setTaskForm({ title: '', description: '', assigneeId: '', priority: 'MEDIUM', startDate: '', deadline: '' });
    },
    onError: errorToast,
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post(`/projects/${id}/invite`, { userId: inviteUserId, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'Invitation sent' });
      setInviteOpen(false);
    },
    onError: errorToast,
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () => api.post(`/projects/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'You joined the project' });
    },
  });

  const span = useMemo(() => planWindow(tasks), [tasks]);
  const rows = useMemo(() => tasks.map((t) => taskRow(t, `/projects/${id}/tasks/${t.id}`)), [tasks, id]);

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const myMembership = project?.members?.find((m) => m.userId === user?.id);
  const isProjectAdmin = isAdmin || myMembership?.role === 'PROJECT_ADMIN';
  const pendingInvite = myMembership?.status === 'PENDING';
  const acceptedMembers = project?.members?.filter((m) => m.status === 'ACCEPTED') ?? [];
  const nonMembers = allUsers.filter((u) => !project?.members?.find((m) => m.userId === u.id));

  const counts = tasks.reduce((c, t) => { c[taskState(t)]++; return c; }, { pencil: 0, ink: 0, done: 0, late: 0 });

  if (projLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="skeleton h-12 w-80" />
        <Skeleton className="skeleton h-96 w-full" />
      </div>
    );
  }
  if (!project) return <div className="p-6 text-muted-foreground">This project could not be found.</div>;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="sheet px-4 pb-5 pt-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-print pb-2">
          <div className="min-w-0">
            <p className="font-heading text-[13px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
              Project · {project.status.toLowerCase()}
            </p>
            <h1 className="print-head text-[clamp(34px,5vw,60px)]">{project.name}</h1>
          </div>
          <div className="text-right font-heading text-[15px] font-medium uppercase tracking-[.07em] text-muted-foreground">
            {project.startDate && project.endDate && (
              <p>{format(new Date(project.startDate), 'd MMM')} – {format(new Date(project.endDate), 'd MMM yyyy')}</p>
            )}
            <p>{counts.done} of {tasks.length} done</p>
          </div>
        </div>

        {project.description && <p className="mt-3 max-w-3xl text-[15px] text-muted-foreground">{project.description}</p>}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 font-heading text-[15px] font-semibold uppercase tracking-[.06em]">
            {([['planner', 'Planner'], ['list', `List · ${tasks.length}`], ['members', `People · ${acceptedMembers.length}`]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={cn('rounded-[3px] border-[1.5px] px-3 py-1.5',
                  view === v ? 'border-print bg-print text-paper' : 'border-rule text-muted-foreground hover:text-print')}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingInvite && (
              <button onClick={() => acceptInviteMutation.mutate()} className="btn-pen h-9 px-4 text-sm">Join this project</button>
            )}
            {isProjectAdmin && (
              <>
                <button onClick={() => setInviteOpen(true)} className="btn-line h-9 px-3 text-sm"><UserPlus className="h-4 w-4" /> Invite</button>
                <button onClick={() => setCreateTaskOpen(true)} className="btn-ink h-9 px-4 text-sm"><Plus className="h-4 w-4" /> Pencil in a task</button>
              </>
            )}
          </div>
        </div>

        {counts.pencil > 0 && view !== 'members' && (
          <p className="hand mt-4 text-[22px] leading-none text-pen">
            {counts.pencil === 1 ? 'one task is' : `${counts.pencil} tasks are`} still in pencil, waiting for the assignee to agree
          </p>
        )}

        <div className="mt-4">
          {tasksLoading ? (
            <Skeleton className="skeleton h-72 w-full" />
          ) : view === 'members' ? (
            <div className="divide-y divide-rule border-t border-rule">
              {project.members?.map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-print font-heading text-sm font-bold text-paper">
                    {member.user?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{member.user?.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.user?.email}</p>
                  </div>
                  <span className="font-heading text-[13px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
                    {member.role === 'PROJECT_ADMIN' ? 'Project admin' : 'Member'}
                    {member.status !== 'ACCEPTED' && <span className="ml-2 text-warning">invite {member.status.toLowerCase()}</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="border-t border-rule py-14 text-center">
              <p className="hand text-[26px] text-graphite">nothing pencilled in yet</p>
              {isProjectAdmin && (
                <button onClick={() => setCreateTaskOpen(true)} className="btn-ink mt-4 h-10 px-4 text-sm"><Plus className="h-4 w-4" /> Pencil in the first task</button>
              )}
            </div>
          ) : view === 'planner' ? (
            <>
              <Planner rows={rows} from={span.from} weeks={span.weeks} />
              <PlannerLegend />
            </>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-sm">
                <thead>
                  <tr className="font-heading text-[13px] font-semibold uppercase tracking-[.06em] text-muted-foreground">
                    <th className="py-2 pr-3 text-left">Task</th>
                    <th className="py-2 pr-3 text-left">Assignee</th>
                    <th className="py-2 pr-3 text-left">Dates</th>
                    <th className="py-2 pr-3 text-left">Priority</th>
                    <th className="py-2 text-right">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const s = taskState(t);
                    return (
                      <tr key={t.id} className="border-t border-rule hover:bg-pen/[0.035]">
                        <td className="py-3 pr-3"><Link to={`/projects/${id}/tasks/${t.id}`} className="font-medium hover:text-pen">{t.title}</Link></td>
                        <td className="py-3 pr-3 text-muted-foreground">{t.assignee.fullName}</td>
                        <td className={cn('py-3 pr-3 font-medium', STATE_COLOR[s])}>{stateLabel(s)}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{t.priority.toLowerCase()}</td>
                        <td className="py-3 text-right font-mono text-[13px]">{format(new Date(t.deadline), 'd MMM yyyy')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="print-head text-3xl">Pencil in a task</DialogTitle>
          </DialogHeader>
          <p className="-mt-2 text-sm text-muted-foreground">The dates stay in pencil until the assignee agrees to them.</p>
          <div className="space-y-4 py-2">
            <div>
              <label className="field-label" htmlFor="t-title">Title</label>
              <input id="t-title" className="field" value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="field-label" htmlFor="t-desc">Description</label>
              <textarea id="t-desc" rows={2} className="field h-auto py-2" value={taskForm.description}
                onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="field-label">Assignee</span>
                <Select value={taskForm.assigneeId} onValueChange={(v) => setTaskForm((f) => ({ ...f, assigneeId: v }))}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Choose a person" /></SelectTrigger>
                  <SelectContent>
                    {acceptedMembers.map((m) => <SelectItem key={m.userId} value={m.userId}>{m.user?.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="field-label">Priority</span>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="t-start">Start</label>
                <input id="t-start" type="datetime-local" className="field" value={taskForm.startDate}
                  onChange={(e) => setTaskForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="t-end">Deadline</label>
                <input id="t-end" type="datetime-local" className="field" value={taskForm.deadline}
                  onChange={(e) => setTaskForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setCreateTaskOpen(false)} className="btn-line h-10 px-4 text-sm">Cancel</button>
            <button onClick={() => createTaskMutation.mutate()}
              disabled={createTaskMutation.isPending || !taskForm.title || !taskForm.assigneeId || !taskForm.startDate || !taskForm.deadline}
              className="btn-ink h-10 px-4 text-sm">
              {createTaskMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : 'Pencil it in'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="print-head text-3xl">Invite to project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <span className="field-label">Person</span>
              <Select value={inviteUserId} onValueChange={setInviteUserId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Choose someone from the team" /></SelectTrigger>
                <SelectContent>
                  {nonMembers.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="field-label">Role</span>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="PROJECT_ADMIN">Project admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setInviteOpen(false)} className="btn-line h-10 px-4 text-sm">Cancel</button>
            <button onClick={() => inviteMutation.mutate()} disabled={!inviteUserId || inviteMutation.isPending} className="btn-ink h-10 px-4 text-sm">
              {inviteMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : 'Send invitation'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
