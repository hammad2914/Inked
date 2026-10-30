import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import type { Project, ApiResponse } from '@/types';

export function ProjectsListPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<ApiResponse<Project[]>>('/projects').then((r) => r.data.data),
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
      toast({ title: 'Project started' });
      setCreateOpen(false);
      setForm({ name: '', description: '', startDate: '', endDate: '' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'The project was not created', description: e.response?.data?.message ?? 'Try again.' });
    },
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="sheet px-4 pb-6 pt-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-print pb-2">
          <h1 className="print-head text-[clamp(36px,5vw,60px)]">Projects</h1>
          {isAdmin && (
            <button onClick={() => setCreateOpen(true)} className="btn-ink mb-1 h-10 px-4 text-sm"><Plus className="h-4 w-4" /> Start a project</button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="skeleton mt-4 h-60 w-full" />
        ) : projects.length === 0 ? (
          <p className="hand py-14 text-center text-[26px] text-graphite">no projects yet{isAdmin ? '. start the first one' : ''}</p>
        ) : (
          <ul className="divide-y divide-rule">
            {projects.map((p) => {
              const people = p.members?.filter((m) => m.status === 'ACCEPTED').length ?? 0;
              return (
                <li key={p.id}>
                  <Link to={`/projects/${p.id}`} className="group grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="print-head text-[28px] group-hover:text-pen">{p.name}</p>
                      {p.description && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{p.description}</p>}
                    </div>
                    <p className="font-heading text-[14px] font-semibold uppercase tracking-[.07em] text-muted-foreground sm:text-right">
                      {p.startDate && p.endDate && <span className="block">{format(new Date(p.startDate), 'd MMM')} – {format(new Date(p.endDate), 'd MMM yyyy')}</span>}
                      {p._count?.tasks ?? 0} tasks · {people} {people === 1 ? 'person' : 'people'}
                      {p.status !== 'ACTIVE' && <span className="text-warning"> · {p.status.toLowerCase()}</span>}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="print-head text-3xl">Start a project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="field-label" htmlFor="p-name">Name</label>
              <input id="p-name" className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="field-label" htmlFor="p-desc">What it's about</label>
              <textarea id="p-desc" rows={3} className="field h-auto py-2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="p-start">Starts</label>
                <input id="p-start" type="date" className="field" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="p-end">Ends</label>
                <input id="p-end" type="date" className="field" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setCreateOpen(false)} className="btn-line h-10 px-4 text-sm">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} className="btn-ink h-10 px-4 text-sm">
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : 'Start it'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
