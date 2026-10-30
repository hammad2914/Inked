import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, ArrowLeft, Loader2, CheckCircle, Clock, AlertCircle, LayoutList, LayoutGrid, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Project, Task, User, ApiResponse } from '@/types';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'border-l-danger',
  HIGH:     'border-l-warning',
  MEDIUM:   'border-l-indigo',
  LOW:      'border-l-cyan',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:     'bg-warning/15 text-warning border border-warning/20',
  ACCEPTED:    'bg-cyan/15 text-cyan border border-cyan/20',
  IN_PROGRESS: 'bg-indigo/15 text-indigo border border-indigo/20',
  COMPLETED:   'bg-success/15 text-success border border-success/20',
  OVERDUE:     'bg-danger/15 text-danger border border-danger/20',
};

interface ProjectStats {
  project: Project; totalTasks: number; completionRate: number;
  timelineProgress: number; tasksByStatus: { status: string; count: number }[];
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
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
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'project', id],
    queryFn: () => api.get<ApiResponse<ProjectStats>>(`/dashboard/project/${id}`).then((r) => r.data.data),
  });
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => api.get<{ data: User[] }>('/users?limit=100').then((r) => r.data.data),
  });

  const createTaskMutation = useMutation({
    mutationFn: () => api.post(`/projects/${id}/tasks`, {
      ...taskForm,
      startDate: new Date(taskForm.startDate).toISOString(),
      deadline:  new Date(taskForm.deadline).toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      toast({ title: '✅ Task created!' });
      setCreateTaskOpen(false);
      setTaskForm({ title: '', description: '', assigneeId: '', priority: 'MEDIUM', startDate: '', deadline: '' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message ?? 'Failed' });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post(`/projects/${id}/invite`, { userId: inviteUserId, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: '✅ Member invited!' });
      setInviteOpen(false);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message ?? 'Failed' });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () => api.post(`/projects/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: '✅ Joined project!' });
    },
  });

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const myMembership = project?.members?.find((m) => m.userId === user?.id);
  const isProjectAdmin = isAdmin || myMembership?.role === 'PROJECT_ADMIN';
  const pendingInvite = myMembership?.status === 'PENDING';
  const acceptedMembers = project?.members?.filter((m) => m.status === 'ACCEPTED') ?? [];
  const nonMembers = allUsers.filter((u) => !project?.members?.find((m) => m.userId === u.id));

  const boardColumns = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];

  if (projLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-72 skeleton" />
        <Skeleton className="h-40 w-full rounded-2xl skeleton" />
      </div>
    );
  }
  if (!project) return <div className="p-6 text-white/40">Project not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <div className="flex items-center gap-2 animate-fade-up">
        <Link to="/projects">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm text-white/30">Projects</span>
        <span className="text-white/20">/</span>
        <span className="text-sm text-white/70 font-medium truncate">{project.name}</span>
      </div>

      {/* Project Banner */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="h-1.5 bg-gradient-primary" />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-heading font-bold text-2xl text-white">{project.name}</h1>
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border',
                  project.status === 'ACTIVE' ? 'bg-indigo/15 text-indigo border-indigo/20' :
                  project.status === 'COMPLETED' ? 'bg-success/15 text-success border-success/20' :
                  'bg-warning/15 text-warning border-warning/20')}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-white/40 leading-relaxed">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-white/30 pt-1">
                {project.startDate && <span>Start: {format(new Date(project.startDate), 'MMM d, yyyy')}</span>}
                {project.endDate && <span>Due: {format(new Date(project.endDate), 'MMM d, yyyy')}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {pendingInvite && (
                <Button onClick={() => acceptInviteMutation.mutate()} variant="outline"
                  className="border-indigo/30 text-indigo hover:bg-indigo/10 rounded-xl h-9">
                  Accept Invitation
                </Button>
              )}
              {isProjectAdmin && (
                <>
                  <Button variant="ghost" onClick={() => setInviteOpen(true)}
                    className="text-white/60 hover:text-white hover:bg-white/[0.07] rounded-xl h-9 gap-1.5">
                    <UserPlus className="h-4 w-4" /> Invite
                  </Button>
                  <Button onClick={() => setCreateTaskOpen(true)}
                    className="bg-gradient-primary text-white rounded-xl h-9 shimmer shadow-glow-sm gap-1.5">
                    <Plus className="h-4 w-4" /> Add Task
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {stats && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-white/35">
                <span>{stats.completionRate}% complete</span>
                <span>{stats.totalTasks} tasks</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <TabsList className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 h-10 gap-1">
          {['overview', 'tasks', 'members'].map((tab) => (
            <TabsTrigger key={tab} value={tab}
              className="rounded-lg text-xs font-semibold uppercase tracking-wide text-white/40 data-[state=active]:bg-indigo/20 data-[state=active]:text-indigo data-[state=active]:shadow-none transition-all capitalize px-4">
              {tab === 'tasks' ? `Tasks (${tasks.length})` : tab === 'members' ? `Members (${acceptedMembers.length})` : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
                {[
                  { label: 'Completion', value: `${stats.completionRate}%`, icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                  { label: 'Timeline',   value: `${stats.timelineProgress}%`, icon: Clock, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
                  { label: 'Total Tasks', value: stats.totalTasks, icon: AlertCircle, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
                ].map(({ label, value, icon: Icon, color, bg }, i) => (
                  <div key={label} className="glass rounded-2xl p-5 card-hover animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/35">{label}</p>
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>
                    </div>
                    <p className="font-heading font-bold text-3xl text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="glass rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/35 mb-4">Tasks by Status</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.tasksByStatus} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="status" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 12, color: "hsl(var(--foreground))", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }} cursor={{ stroke: "rgba(99,102,241,0.25)", strokeWidth: 1 }} />
                    <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl skeleton" />)}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks" className="mt-4">
          {/* View toggle */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}
              className={cn('h-8 w-8 rounded-lg', viewMode === 'list' ? 'bg-indigo/20 text-indigo' : 'text-white/30 hover:text-white hover:bg-white/[0.06]')}>
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode('board')}
              className={cn('h-8 w-8 rounded-lg', viewMode === 'board' ? 'bg-indigo/20 text-indigo' : 'text-white/30 hover:text-white hover:bg-white/[0.06]')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {tasksLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl skeleton" />)}</div>
          ) : tasks.length === 0 ? (
            <div className="glass rounded-2xl flex flex-col items-center py-16 text-center">
              <CheckCircle className="h-10 w-10 text-white/10 mb-3" />
              <p className="font-heading font-semibold text-white/35">No tasks yet</p>
              {isProjectAdmin && (
                <Button onClick={() => setCreateTaskOpen(true)}
                  className="mt-4 bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm gap-1.5 text-sm">
                  <Plus className="h-4 w-4" /> Create first task
                </Button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
              <div className="min-w-[480px] divide-y divide-border stagger">
                {tasks.map((task) => (
                  <Link key={task.id} to={`/projects/${id}/tasks/${task.id}`}>
                    <div className={cn(
                      'flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors border-l-4 animate-fade-in',
                      PRIORITY_COLORS[task.priority] ?? 'border-l-transparent',
                    )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white/85">{task.title}</span>
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border', STATUS_BADGE[task.status] ?? STATUS_BADGE['PENDING'])}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-white/30 mt-0.5">Due {format(new Date(task.deadline), 'MMM d, yyyy')} · {task.assignee.fullName}</p>
                      </div>
                      <Avatar className="h-7 w-7 shrink-0 ring-2 ring-indigo/20">
                        <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-gradient-primary text-white text-[10px] font-bold">{task.assignee.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </Link>
                ))}
              </div>
              </div>
            </div>
          ) : (
            // Board view
            <div className="flex gap-3 overflow-x-auto pb-2">
              {boardColumns.map((status) => {
                const colTasks = tasks.filter((t) => t.status === status);
                return (
                  <div key={status} className="flex-shrink-0 w-64">
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-white/40">{status.replace('_', ' ')}</span>
                      <span className="ml-auto text-xs font-bold text-white/25 bg-white/[0.06] rounded-full px-2 py-0.5">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {colTasks.map((task) => (
                        <Link key={task.id} to={`/projects/${id}/tasks/${task.id}`}>
                          <div className={cn('glass rounded-xl p-3.5 card-hover border-l-4 cursor-pointer', PRIORITY_COLORS[task.priority] ?? 'border-l-transparent')}>
                            <p className="text-sm font-semibold text-white/85 line-clamp-2 mb-2">{task.title}</p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-white/30">{format(new Date(task.deadline), 'MMM d')}</span>
                              <Avatar className="h-6 w-6 ring-1 ring-indigo/20">
                                <AvatarFallback className="bg-gradient-primary text-white text-[9px] font-bold">{task.assignee.fullName.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {isProjectAdmin && (
                        <button onClick={() => setCreateTaskOpen(true)}
                          className="w-full border border-dashed border-white/[0.1] rounded-xl py-2.5 text-xs text-white/25 hover:border-indigo/40 hover:text-indigo/60 transition-all flex items-center justify-center gap-1.5">
                          <Plus className="h-3.5 w-3.5" /> Add task
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
            {project.members?.map((member) => (
              <div key={member.id} className="glass rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <Avatar className="h-10 w-10 ring-2 ring-indigo/20 shrink-0">
                  <AvatarImage src={member.user?.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-heading font-bold">
                    {member.user?.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-white/85 truncate">{member.user?.fullName}</p>
                  <p className="text-xs text-white/35 truncate">{member.user?.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge className={cn('text-[10px] gap-1',
                    member.role === 'PROJECT_ADMIN'
                      ? 'bg-violet/15 text-violet border border-violet/20'
                      : 'bg-white/[0.06] text-white/40 border border-white/[0.08]')}>
                    {member.role === 'PROJECT_ADMIN' && <Shield className="h-2.5 w-2.5" />}
                    {member.role === 'PROJECT_ADMIN' ? 'Admin' : 'Member'}
                  </Badge>
                  {member.status !== 'ACCEPTED' && (
                    <Badge className="text-[10px] bg-warning/15 text-warning border border-warning/20">{member.status}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent className="glass-elevated border-white/[0.09] rounded-2xl shadow-modal max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-white">Create Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Title</Label>
              <Input placeholder="Task title…" value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Description</Label>
              <Textarea placeholder="Describe the task…" value={taskForm.description}
                onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Assignee</Label>
                <Select value={taskForm.assigneeId} onValueChange={(v) => setTaskForm((f) => ({ ...f, assigneeId: v }))}>
                  <SelectTrigger className="h-10 bg-background border-white/[0.08] text-white rounded-lg">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent className="glass-elevated border-white/[0.08] rounded-xl">
                    {acceptedMembers.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>{m.user?.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-10 bg-background border-white/[0.08] text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-elevated border-white/[0.08] rounded-xl">
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Start Date</Label>
                <Input type="datetime-local" value={taskForm.startDate}
                  onChange={(e) => setTaskForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="h-10 bg-background border-white/[0.08] text-white focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Deadline</Label>
                <Input type="datetime-local" value={taskForm.deadline}
                  onChange={(e) => setTaskForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="h-10 bg-background border-white/[0.08] text-white focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setCreateTaskOpen(false)}
              className="text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl">Cancel</Button>
            <Button onClick={() => createTaskMutation.mutate()}
              disabled={createTaskMutation.isPending || !taskForm.title || !taskForm.assigneeId}
              className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm">
              {createTaskMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</> : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="glass-elevated border-white/[0.09] rounded-2xl shadow-modal max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-white">Invite to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Team Member</Label>
              <Select value={inviteUserId} onValueChange={setInviteUserId}>
                <SelectTrigger className="h-10 bg-background border-white/[0.08] text-white rounded-lg">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent className="glass-elevated border-white/[0.08] rounded-xl">
                  {nonMembers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-10 bg-background border-white/[0.08] text-white rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-elevated border-white/[0.08] rounded-xl">
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="PROJECT_ADMIN">Project Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}
              className="text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl">Cancel</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={!inviteUserId || inviteMutation.isPending}
              className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm">
              {inviteMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Inviting…</> : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
