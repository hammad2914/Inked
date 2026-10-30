import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderKanban, Users, Calendar, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Project, ApiResponse } from '@/types';

const STATUS_COLOR: Record<string, { bar: string; badge: string; text: string }> = {
  ACTIVE:    { bar: '#6366F1', badge: 'bg-indigo/15 text-indigo border-indigo/20',  text: 'Active'    },
  COMPLETED: { bar: '#10B981', badge: 'bg-success/15 text-success border-success/20', text: 'Completed' },
  ON_HOLD:   { bar: '#F59E0B', badge: 'bg-warning/15 text-warning border-warning/20', text: 'On Hold'   },
  ARCHIVED:  { bar: '#6B7280', badge: 'bg-white/[0.06] text-white/30 border-white/[0.08]', text: 'Archived'  },
};

export function ProjectsListPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () =>
      api.get<ApiResponse<Project[]>>('/projects').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/projects', {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate:   form.endDate   ? new Date(form.endDate).toISOString()   : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: '✅ Project created!' });
      setCreateOpen(false);
      setForm({ name: '', description: '', startDate: '', endDate: '' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message ?? 'Failed' });
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Projects</h1>
          <p className="text-sm text-white/35 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-primary text-white rounded-xl h-10 px-4 shimmer shadow-glow-sm hover:shadow-glow transition-all gap-2"
          >
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl skeleton" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center animate-fade-up">
          <div className="h-20 w-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <FolderKanban className="h-9 w-9 text-white/15" />
          </div>
          <p className="font-heading font-semibold text-lg text-white/40">No projects yet</p>
          <p className="text-sm text-white/25 mt-1 mb-5">Create your first project to get started</p>
          {isAdmin && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm gap-2"
            >
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {projects.map((project) => {
            const colors = STATUS_COLOR[project.status] ?? STATUS_COLOR['ACTIVE'];
            const taskCount = project._count?.tasks ?? 0;
            const memberCount = project.members?.filter((m) => m.status === 'ACCEPTED').length ?? 0;
            const accepted = project.members?.filter((m) => m.status === 'ACCEPTED') ?? [];

            return (
              <Link key={project.id} to={`/projects/${project.id}`} className="group block">
                <div className="glass rounded-2xl overflow-hidden card-hover border border-white/[0.06] group-hover:border-indigo/30 transition-all animate-fade-in">
                  {/* Accent strip */}
                  <div className="h-1 w-full" style={{ background: colors.bar }} />

                  <div className="p-5 space-y-4">
                    {/* Name + status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading font-bold text-white leading-tight line-clamp-1 flex-1">{project.name}</h3>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border shrink-0', colors.badge)}>
                        {colors.text}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">{project.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-white/35">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success/60" />
                        {taskCount} task{taskCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-indigo/60" />
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </span>
                      {project.endDate && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-warning/60" />
                          {format(new Date(project.endDate), 'MMM d')}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Avatar stack */}
                      <div className="flex -space-x-2">
                        {accepted.slice(0, 4).map((m) => (
                          <Avatar key={m.id} className="h-7 w-7 ring-2 ring-[#121929]">
                            <AvatarImage src={m.user?.avatarUrl ?? undefined} />
                            <AvatarFallback className="bg-gradient-primary text-white text-[10px] font-bold">
                              {m.user?.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {accepted.length > 4 && (
                          <div className="h-7 w-7 rounded-full bg-white/[0.08] ring-2 ring-[#121929] flex items-center justify-center text-[10px] text-white/50 font-medium">
                            +{accepted.length - 4}
                          </div>
                        )}
                      </div>

                      <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-indigo group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-elevated border-white/[0.09] rounded-2xl shadow-modal max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-indigo" /> New Project
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Project Name</Label>
              <Input
                placeholder="e.g. Q4 Product Launch"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Description</Label>
              <Textarea
                placeholder="What is this project about?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="h-10 bg-background border-white/[0.08] text-white focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="h-10 bg-background border-white/[0.08] text-white focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}
              className="text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.name || createMutation.isPending}
              className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm"
            >
              {createMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</>
                : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
