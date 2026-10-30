import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Lock, Send, Loader2, CheckCircle2, RotateCcw,
  Play, Pencil, AlertTriangle, Save, X, Calendar, User2, Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Task, TaskComment, Project, ApiResponse } from '@/types';

function toDatetimeLocal(iso: string) {
  return iso ? iso.slice(0, 16) : '';
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:      'bg-warning/15 text-warning border border-warning/25',
  ACCEPTED:     'bg-cyan/15 text-cyan border border-cyan/25',
  IN_PROGRESS:  'bg-indigo/15 text-indigo border border-indigo/25',
  COMPLETED:    'bg-success/15 text-success border border-success/25',
  OVERDUE:      'bg-danger/15 text-danger border border-danger/25',
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: 'text-danger',
  HIGH:     'text-warning',
  MEDIUM:   'text-indigo',
  LOW:      'text-cyan',
};

export function TaskDetailPage() {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const [comment, setComment] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevision, setShowRevision] = useState(false);
  const [editing, setEditing] = useState(false);
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

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        startDate: toDatetimeLocal(task.startDate),
        deadline: toDatetimeLocal(task.deadline),
      });
    }
  }, [task]);

  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const myMembership = project?.members?.find((m) => m.userId === user?.id);
  const isProjectAdmin = isCompanyAdmin || myMembership?.role === 'PROJECT_ADMIN';
  const isAssignee = task?.assignee?.id === user?.id;

  const hasRevisionRequest = (task?.comments ?? []).some((c: TaskComment) => c.content.startsWith('[REVISION REQUEST]'));
  const revisionPending = task?.status === 'PENDING' && !task?.timelineAccepted && hasRevisionRequest;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['task', taskId] });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/comments`, { content: comment }),
    onSuccess: () => { invalidate(); setComment(''); },
    onError: () => toast({ variant: 'destructive', title: 'Failed to send comment' }),
  });

  const acceptTimelineMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/accept-timeline`),
    onSuccess: () => { invalidate(); toast({ title: '✅ Timeline accepted! Deadline is now locked.' }); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message ?? 'Failed' });
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/request-revision`, { comment: revisionReason }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Revision requested', description: 'Admin has been notified.' });
      setRevisionReason(''); setShowRevision(false);
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed' }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: () => { invalidate(); toast({ title: 'Status updated' }); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message ?? 'Failed' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: () => api.patch(`/tasks/${taskId}`, {
      title: editForm.title,
      description: editForm.description || undefined,
      priority: editForm.priority,
      startDate: new Date(editForm.startDate).toISOString(),
      deadline:  new Date(editForm.deadline).toISOString(),
    }),
    onSuccess: () => {
      invalidate();
      toast({ title: '✅ Task updated' });
      setEditing(false);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Update failed', description: e.response?.data?.message ?? 'Could not update task.' });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64 skeleton" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-80 col-span-2 rounded-2xl skeleton" />
          <Skeleton className="h-80 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }
  if (!task) return <div className="p-6 text-white/40">Task not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <div className="flex items-center gap-2 animate-fade-up">
        <Link to={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm text-white/30 truncate">{project?.name ?? 'Project'}</span>
        <span className="text-white/20">/</span>
        <span className="text-sm text-white/70 font-medium truncate max-w-xs">{task.title}</span>
      </div>

      {/* Revision alert */}
      {revisionPending && isProjectAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/[0.08] p-4 animate-fade-in">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-warning text-sm">Revision Requested</p>
            <p className="text-sm text-warning/70 mt-0.5">The assignee has requested a timeline change. Review the comments and update the dates.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Main ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-5 space-y-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border', STATUS_BADGE[task.status] ?? STATUS_BADGE['PENDING'])}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-white/[0.06] border border-white/[0.08]', PRIORITY_COLOR[task.priority] ?? 'text-white/50')}>
                  <Flag className="h-3 w-3" /> {task.priority}
                </span>
                {task.timelineAccepted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-success/10 text-success border border-success/20">
                    <Lock className="h-3 w-3" /> Timeline Locked
                  </span>
                )}
              </div>
              {isProjectAdmin && !editing && !task.timelineAccepted && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}
                  className="h-8 text-white/40 hover:text-white hover:bg-white/[0.07] rounded-lg gap-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {editing && (
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditForm({ title: task.title, description: task.description ?? '', priority: task.priority, startDate: toDatetimeLocal(task.startDate), deadline: toDatetimeLocal(task.deadline) }); }}
                  className="h-8 text-white/40 hover:text-white hover:bg-white/[0.07] rounded-lg gap-1.5 text-xs">
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
            </div>

            {/* Read-only */}
            {!editing && (
              <>
                {task.description && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">Description</p>
                    <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                {/* Assignee actions */}
                {isAssignee && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {task.status === 'PENDING' && (
                      <>
                        <Button size="sm" onClick={() => acceptTimelineMutation.mutate()}
                          disabled={acceptTimelineMutation.isPending}
                          className="bg-success/15 text-success hover:bg-success/25 border border-success/25 rounded-lg h-8 text-xs gap-1.5">
                          {acceptTimelineMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Accept Timeline
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowRevision(!showRevision)}
                          className="h-8 text-white/50 hover:text-white hover:bg-white/[0.07] border border-white/[0.1] rounded-lg text-xs gap-1.5">
                          <RotateCcw className="h-3 w-3" /> Request Revision
                        </Button>
                      </>
                    )}
                    {task.status === 'ACCEPTED' && (
                      <Button size="sm" onClick={() => statusMutation.mutate('IN_PROGRESS')} disabled={statusMutation.isPending}
                        className="bg-indigo/15 text-indigo hover:bg-indigo/25 border border-indigo/25 rounded-lg h-8 text-xs gap-1.5">
                        <Play className="h-3 w-3" /> Start Working
                      </Button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <Button size="sm" onClick={() => statusMutation.mutate('COMPLETED')} disabled={statusMutation.isPending}
                        className="bg-success/15 text-success hover:bg-success/25 border border-success/25 rounded-lg h-8 text-xs gap-1.5">
                        <CheckCircle2 className="h-3 w-3" /> Mark Complete
                      </Button>
                    )}
                    {task.status === 'OVERDUE' && (
                      <>
                        <Button size="sm" onClick={() => statusMutation.mutate('IN_PROGRESS')} disabled={statusMutation.isPending}
                          className="bg-indigo/15 text-indigo hover:bg-indigo/25 border border-indigo/25 rounded-lg h-8 text-xs gap-1.5">
                          <Play className="h-3 w-3" /> Resume Working
                        </Button>
                        <Button size="sm" onClick={() => statusMutation.mutate('COMPLETED')} disabled={statusMutation.isPending}
                          className="bg-warning/15 text-warning hover:bg-warning/25 border border-warning/25 rounded-lg h-8 text-xs gap-1.5">
                          <CheckCircle2 className="h-3 w-3" /> Complete (Late)
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Revision form */}
                {showRevision && (
                  <div className="rounded-xl border border-warning/20 bg-warning/[0.06] p-4 space-y-3 animate-fade-in">
                    <p className="text-sm font-semibold text-warning">Revision Request</p>
                    <Textarea
                      placeholder="Why do you need a timeline revision?"
                      value={revisionReason}
                      onChange={(e) => setRevisionReason(e.target.value)}
                      rows={3}
                      className="bg-black/20 border-warning/20 text-white placeholder:text-white/30 rounded-lg resize-none text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setShowRevision(false)}
                        className="h-8 text-white/40 hover:text-white rounded-lg text-xs">Cancel</Button>
                      <Button size="sm" onClick={() => requestRevisionMutation.mutate()}
                        disabled={!revisionReason || requestRevisionMutation.isPending}
                        className="bg-warning/15 text-warning hover:bg-warning/25 border border-warning/25 rounded-lg h-8 text-xs">
                        Submit
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Edit form */}
            {editing && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">Title</Label>
                  <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="h-10 bg-background border-white/[0.08] text-white focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">Description</Label>
                  <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Task description…"
                    className="bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg resize-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">Priority</Label>
                  <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger className="h-10 bg-background border-white/[0.08] text-white rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-elevated border-white/[0.08] rounded-xl">
                      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {task.timelineAccepted ? (
                  <div className="rounded-xl border border-dashed border-success/20 bg-success/[0.04] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-success/70">
                      <Lock className="h-3.5 w-3.5" /> Timeline locked — accepted by assignee
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white/60">
                      <div>
                        <p className="text-xs text-white/30 mb-0.5">Start</p>
                        <p className="font-medium">{format(new Date(task.startDate), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/30 mb-0.5">Deadline</p>
                        <p className="font-medium">{format(new Date(task.deadline), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">Start Date</Label>
                      <Input type="datetime-local" value={editForm.startDate}
                        onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="h-10 bg-background border-white/[0.08] text-white focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">Deadline</Label>
                      <Input type="datetime-local" value={editForm.deadline}
                        onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
                        className="h-10 bg-background border-white/[0.08] text-white focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg" />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => updateTaskMutation.mutate()}
                    disabled={!editForm.title || updateTaskMutation.isPending}
                    className="bg-gradient-primary text-white rounded-lg h-9 shimmer shadow-glow-sm gap-1.5 text-xs">
                    {updateTaskMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Comments ── */}
          <div className="glass rounded-2xl p-5 space-y-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <h2 className="font-heading font-semibold text-sm text-white">
              Comments <span className="text-white/30">({task.comments?.length ?? 0})</span>
            </h2>

            <div className="space-y-0 relative max-h-72 overflow-y-auto pr-1">
              {(task.comments?.length ?? 0) > 0 && (
                <div className="absolute left-[19px] top-3 bottom-3 w-px bg-white/[0.05]" />
              )}
              {(task.comments ?? []).map((c: TaskComment) => (
                <div key={c.id} className="flex gap-3 py-2.5 hover:bg-white/[0.02] rounded-xl px-2 transition-colors">
                  <Avatar className="h-8 w-8 shrink-0 ring-2 ring-indigo/15 relative z-10">
                    <AvatarImage src={c.user.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">{c.user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/75">{c.user.fullName}</span>
                      <span className="text-[11px] text-white/25">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className={cn('text-sm mt-1 leading-relaxed',
                      c.content.startsWith('[REVISION REQUEST]')
                        ? 'text-warning/80 font-medium'
                        : 'text-white/55')}>
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
              {(task.comments ?? []).length === 0 && (
                <p className="text-sm text-white/25 text-center py-6">No comments yet — start the conversation</p>
              )}
            </div>

            <Separator className="bg-white/[0.06]" />

            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                  {user?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg resize-none text-sm"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => commentMutation.mutate()}
                    disabled={!comment.trim() || commentMutation.isPending}
                    className="bg-gradient-primary text-white rounded-lg h-8 shimmer shadow-glow-sm gap-1.5 text-xs">
                    {commentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="glass rounded-2xl p-4 space-y-3.5">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">
                <User2 className="h-3 w-3" /> Assigned To
              </div>
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 ring-2 ring-indigo/20">
                  <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">{task.assignee.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-white/80">{task.assignee.fullName}</p>
                  <p className="text-xs text-white/35 font-mono">{task.assignee.email}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">
                <Flag className="h-3 w-3" /> Priority
              </div>
              <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-white/[0.06] border border-white/[0.08]', PRIORITY_COLOR[task.priority] ?? 'text-white/50')}>
                <Flag className="h-3 w-3" /> {task.priority}
              </span>
            </div>

            <Separator className="bg-white/[0.06]" />

            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">
                <Calendar className="h-3 w-3" /> Timeline
                {task.timelineAccepted && <Lock className="h-3 w-3 ml-1 text-success/50" />}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/35">Start</span>
                  <span className="text-xs font-medium text-white/65 font-mono">{format(new Date(task.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/35">Deadline</span>
                  <span className="text-xs font-semibold text-white/80 font-mono">{format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                </div>
                {task.completedAt && (() => {
                  const late = new Date(task.completedAt) > new Date(task.deadline);
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">Completed</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium font-mono ${late ? 'text-warning' : 'text-success'}`}>
                          {format(new Date(task.completedAt), 'MMM d, yyyy')}
                        </span>
                        {late && (
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-warning/15 text-warning border border-warning/25">
                            Late
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">
                <User2 className="h-3 w-3" /> Created By
              </div>
              <p className="text-xs text-white/55 font-medium">{task.creator.fullName}</p>
              <p className="text-[11px] text-white/25 mt-0.5 font-mono">{format(new Date(task.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
