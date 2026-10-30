import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { taskState } from '@/components/planner/plan';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Task, TaskComment, Project, ApiResponse } from '@/types';

function toDatetimeLocal(iso: string) {
  return iso ? iso.slice(0, 16) : '';
}

const REVISION = '[REVISION REQUEST]';

const STATUS_TEXT: Record<string, string> = {
  PENDING: 'Waiting for agreement',
  ACCEPTED: 'Agreed, not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Done',
  OVERDUE: 'Past its deadline',
};

/** The task's dates drawn the way the planner draws them: pencil until agreed, then ink. */
function DateStroke({ inked, animate }: { inked: boolean; animate: boolean }) {
  if (!inked) {
    return (
      <svg viewBox="0 0 600 30" preserveAspectRatio="none" className="h-[30px] w-full overflow-visible">
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M6 ${10 + k * 5} L594 ${11 + k * 5 - (k % 2)}`} stroke="#8C877D" strokeWidth={1.3}
            strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    );
  }
  return (
    <div style={animate ? { animation: 'ink-in 1.1s cubic-bezier(.55,0,.25,1) both' } : undefined}>
      <svg viewBox="0 0 600 30" preserveAspectRatio="none" className="h-[30px] w-full overflow-visible">
        <path d="M8 15 L592 16" stroke="#1D3FD8" strokeWidth={14} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export function TaskDetailPage() {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const [comment, setComment] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevision, setShowRevision] = useState(false);
  const [editing, setEditing] = useState(false);
  const [justAgreed, setJustAgreed] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'MEDIUM', startDate: '', deadline: '' });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get<ApiResponse<Task>>(`/tasks/${taskId}`).then((r) => r.data.data),
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<ApiResponse<Project>>(`/projects/${projectId}`).then((r) => r.data.data),
    enabled: !!projectId,
  });

  const resetForm = (t: Task) => setEditForm({
    title: t.title,
    description: t.description ?? '',
    priority: t.priority,
    startDate: toDatetimeLocal(t.startDate),
    deadline: toDatetimeLocal(t.deadline),
  });

  useEffect(() => { if (task) resetForm(task); }, [task]);

  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const myMembership = project?.members?.find((m) => m.userId === user?.id);
  const isProjectAdmin = isCompanyAdmin || myMembership?.role === 'PROJECT_ADMIN';
  const isAssignee = task?.assignee?.id === user?.id;

  const hasRevisionRequest = (task?.comments ?? []).some((c: TaskComment) => c.content.startsWith(REVISION));
  const revisionPending = task?.status === 'PENDING' && !task?.timelineAccepted && hasRevisionRequest;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
  };
  const errorToast = (err: unknown) => {
    const e = err as { response?: { data?: { message?: string } } };
    toast({ variant: 'destructive', title: 'That did not save', description: e.response?.data?.message ?? 'Try again.' });
  };

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/comments`, { content: comment }),
    onSuccess: () => { invalidate(); setComment(''); },
    onError: errorToast,
  });

  const acceptTimelineMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/accept-timeline`),
    onSuccess: () => { setJustAgreed(true); invalidate(); toast({ title: 'Inked', description: 'These dates are locked now.' }); },
    onError: errorToast,
  });

  const requestRevisionMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/request-revision`, { comment: revisionReason }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Asked for new dates', description: 'The project admin has been told.' });
      setRevisionReason(''); setShowRevision(false);
    },
    onError: errorToast,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: () => { invalidate(); toast({ title: 'Status updated' }); },
    onError: errorToast,
  });

  const updateTaskMutation = useMutation({
    mutationFn: () => api.patch(`/tasks/${taskId}`, {
      title: editForm.title,
      description: editForm.description || undefined,
      priority: editForm.priority,
      startDate: new Date(editForm.startDate).toISOString(),
      deadline:  new Date(editForm.deadline).toISOString(),
    }),
    onSuccess: () => { invalidate(); toast({ title: 'Task updated' }); setEditing(false); },
    onError: errorToast,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="skeleton h-12 w-96" />
        <Skeleton className="skeleton h-80 w-full" />
      </div>
    );
  }
  if (!task) return <div className="p-6 text-muted-foreground">This task could not be found.</div>;

  const state = taskState(task);
  const first = task.assignee.fullName.split(' ')[0];
  const lateDone = task.completedAt && new Date(task.completedAt) > new Date(task.deadline);

  let dateNote: string;
  if (task.timelineAccepted) dateNote = `inked by ${isAssignee ? 'you' : first}. nobody can change these now`;
  else if (revisionPending) dateNote = `${isAssignee ? 'you' : first} asked for different dates`;
  else dateNote = `in pencil until ${isAssignee ? 'you agree' : `${first} agrees`}`;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="sheet px-4 pb-6 pt-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-print pb-2">
          <div className="min-w-0">
            <p className="font-heading text-[13px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
              {project?.name ?? 'Task'} · {task.priority.toLowerCase()} priority
            </p>
            <h1 className="print-head text-[clamp(32px,4.6vw,54px)]">{task.title}</h1>
          </div>
          <p className={cn('font-heading text-[15px] font-semibold uppercase tracking-[.07em]', state === 'late' ? 'text-danger' : 'text-muted-foreground')}>
            {STATUS_TEXT[task.status] ?? task.status}
          </p>
        </div>

        {/* The dates are the whole point of the product, so they lead the page */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <div className="flex items-end justify-between gap-4 font-mono">
              <div>
                <p className="field-label">Start</p>
                <p className="text-[clamp(17px,2.4vw,24px)]">{format(new Date(task.startDate), 'EEE d MMM yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="field-label">Deadline</p>
                <p className={cn('text-[clamp(17px,2.4vw,24px)]', state === 'late' && 'text-danger')}>{format(new Date(task.deadline), 'EEE d MMM yyyy')}</p>
              </div>
            </div>
            <div className="mt-2"><DateStroke inked={task.timelineAccepted} animate={justAgreed} /></div>
            <p className={cn('hand mt-1 text-[24px] leading-tight', task.timelineAccepted ? 'text-pen' : revisionPending ? 'text-danger' : 'text-graphite')}>
              {task.timelineAccepted && <Lock className="mr-1.5 inline h-4 w-4 -translate-y-0.5" />}{dateNote}
            </p>
            {task.completedAt && (
              <p className="mt-2 text-sm text-muted-foreground">
                Finished {format(new Date(task.completedAt), 'd MMM yyyy')}{lateDone && <span className="font-semibold text-danger">, after the deadline</span>}
              </p>
            )}

            {revisionPending && isProjectAdmin && !isAssignee && (
              <p className="mt-4 rounded-[3px] bg-danger/[0.07] px-4 py-3 text-sm">
                <b className="text-danger">{first} asked for new dates.</b> Read why in the notes, then change the dates. They go back to pencil for {first} to agree again.
              </p>
            )}

            {isAssignee && !editing && (
              <div className="mt-5 flex flex-wrap gap-2">
                {task.status === 'PENDING' && (
                  <>
                    <button onClick={() => acceptTimelineMutation.mutate()} disabled={acceptTimelineMutation.isPending} className="btn-pen h-11 px-5">
                      {acceptTimelineMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Agree to these dates
                    </button>
                    <button onClick={() => setShowRevision((v) => !v)} className="btn-line h-11 px-4">Ask for different dates</button>
                  </>
                )}
                {task.status === 'ACCEPTED' && (
                  <button onClick={() => statusMutation.mutate('IN_PROGRESS')} disabled={statusMutation.isPending} className="btn-ink h-11 px-5">Start working</button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button onClick={() => statusMutation.mutate('COMPLETED')} disabled={statusMutation.isPending} className="btn-ink h-11 px-5">Mark it done</button>
                )}
                {task.status === 'OVERDUE' && (
                  <>
                    <button onClick={() => statusMutation.mutate('COMPLETED')} disabled={statusMutation.isPending} className="btn-ink h-11 px-5">Mark it done, late</button>
                    <button onClick={() => statusMutation.mutate('IN_PROGRESS')} disabled={statusMutation.isPending} className="btn-line h-11 px-4">Keep working</button>
                  </>
                )}
              </div>
            )}

            {showRevision && (
              <div className="mt-4 space-y-3 rounded-[3px] border-[1.5px] border-rule bg-white p-4">
                <label className="field-label" htmlFor="why">Why do you need different dates?</label>
                <textarea id="why" rows={3} className="field h-auto py-2" value={revisionReason} onChange={(e) => setRevisionReason(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowRevision(false)} className="btn-line h-9 px-3 text-sm">Cancel</button>
                  <button onClick={() => requestRevisionMutation.mutate()} disabled={!revisionReason || requestRevisionMutation.isPending} className="btn-ink h-9 px-4 text-sm">Send the request</button>
                </div>
              </div>
            )}
          </div>

          <dl className="space-y-3 border-t border-rule pt-4 text-sm lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <dt className="field-label">Assigned to</dt>
              <dd className="font-semibold">{task.assignee.fullName}</dd>
              <dd className="font-mono text-xs text-muted-foreground">{task.assignee.email}</dd>
            </div>
            <div>
              <dt className="field-label">Pencilled in by</dt>
              <dd>{task.creator.fullName}, {format(new Date(task.createdAt), 'd MMM yyyy')}</dd>
            </div>
            {isProjectAdmin && !task.timelineAccepted && !editing && (
              <button onClick={() => setEditing(true)} className="btn-line h-9 px-3 text-sm">Change the details</button>
            )}
            {isProjectAdmin && task.timelineAccepted && task.status !== 'COMPLETED' && (
              <p className="text-xs text-muted-foreground">The dates are locked. Only {isAssignee ? 'you' : first} can ask to change them.</p>
            )}
          </dl>
        </div>

        {!editing && task.description && (
          <div className="mt-6 border-t border-rule pt-4">
            <p className="field-label">What needs doing</p>
            <p className="max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed">{task.description}</p>
          </div>
        )}

        {editing && (
          <div className="mt-6 space-y-4 border-t border-rule pt-5">
            <div>
              <label className="field-label" htmlFor="e-title">Title</label>
              <input id="e-title" className="field" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-desc">Description</label>
              <textarea id="e-desc" rows={3} className="field h-auto py-2" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <span className="field-label">Priority</span>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="field-label" htmlFor="e-start">Start</label>
                <input id="e-start" type="datetime-local" className="field" value={editForm.startDate} onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="e-end">Deadline</label>
                <input id="e-end" type="datetime-local" className="field" value={editForm.deadline} onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Saving sends the dates back to {first} in pencil.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(false); resetForm(task); }} className="btn-line h-10 px-4 text-sm">Cancel</button>
              <button onClick={() => updateTaskMutation.mutate()} disabled={!editForm.title || updateTaskMutation.isPending} className="btn-ink h-10 px-4 text-sm">
                {updateTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="sheet px-4 py-5 sm:px-8">
        <h2 className="print-head border-b border-rule pb-2 text-2xl">Notes · {task.comments?.length ?? 0}</h2>
        <div className="max-h-[420px] divide-y divide-rule overflow-y-auto">
          {(task.comments ?? []).map((c: TaskComment) => {
            const isRevision = c.content.startsWith(REVISION);
            return (
              <div key={c.id} className="flex gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-print font-heading text-xs font-bold text-paper">
                  {c.user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]"><b>{c.user.fullName}</b> <span className="font-mono text-[11px] text-muted-foreground">{format(new Date(c.createdAt), 'd MMM, HH:mm')}</span></p>
                  {isRevision && <p className="hand text-[20px] leading-tight text-danger">asked for different dates</p>}
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{isRevision ? c.content.slice(REVISION.length).trim() : c.content}</p>
                </div>
              </div>
            );
          })}
          {(task.comments ?? []).length === 0 && <p className="hand py-6 text-center text-[22px] text-graphite">no notes yet</p>}
        </div>
        <div className="mt-3 flex gap-2 border-t border-rule pt-4">
          <textarea rows={2} placeholder="Add a note for the people on this task" value={comment} onChange={(e) => setComment(e.target.value)} className="field h-auto flex-1 py-2" />
          <button onClick={() => commentMutation.mutate()} disabled={!comment.trim() || commentMutation.isPending} className="btn-ink self-stretch px-4 text-sm" aria-label="Post note">
            {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
