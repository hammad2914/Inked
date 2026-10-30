import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, MoreHorizontal, Loader2, Mail, Shield, Users, RefreshCw, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';
import type { User, ApiResponse } from '@/types';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    'bg-success/15 text-success border border-success/20',
  INACTIVE:  'bg-white/[0.06] text-white/35 border border-white/[0.08]',
  PENDING:   'bg-warning/15 text-warning border border-warning/20',
  SUSPENDED: 'bg-danger/15 text-danger border border-danger/20',
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE:   'bg-success glow-success',
  PENDING:  'bg-warning',
  INACTIVE: 'bg-white/20',
};

export function TeamManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', fullName: '', department: '', designation: '' });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, statusFilter, page],
    queryFn: async () => {
      const r = await api.get<{
        data: User[];
        pagination: { total: number; totalPages: number; page: number; limit: number };
      }>('/users', {
        params: {
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          limit: 12,
        },
      });
      return {
        users: Array.isArray(r.data.data) ? r.data.data : [],
        total: r.data.pagination?.total ?? 0,
        pages: r.data.pagination?.totalPages ?? 1,
      };
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post('/users', inviteForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: '✅ Invitation sent!', description: `${inviteForm.email} will receive an invite email.` });
      setInviteOpen(false);
      setInviteForm({ email: '', fullName: '', department: '', designation: '' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Failed', description: e.response?.data?.message ?? 'Could not send invitation' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: variables.status === 'ACTIVE' ? '✅ User activated' : '🚫 User disabled' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Failed', description: e.response?.data?.message ?? 'Could not update status' });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/auth/resend-invite/${id}`),
    onSuccess: () => {
      toast({ title: '📧 Invitation resent', description: 'A new invite email has been sent.' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Failed', description: e.response?.data?.message ?? 'Could not resend invitation' });
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Team</h1>
          <p className="text-sm text-white/35 mt-1">{total} member{total !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-gradient-primary text-white rounded-xl h-10 px-4 shimmer shadow-glow-sm hover:shadow-glow transition-all gap-2"
        >
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search members…"
            className="pl-9 h-10 bg-surface border-white/[0.08] text-white placeholder:text-white/25 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-10 bg-surface border-white/[0.08] text-white/70 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-elevated border-white/[0.08] rounded-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
        {/* Scrollable wrapper */}
        <div className="overflow-x-auto">
        <div className="min-w-[640px]">

        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_48px] gap-4 px-5 py-3 border-b border-white/[0.06]">
          {['Member', 'Department', 'Role', 'Status', ''].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-foreground/25">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_48px] gap-4 px-5 py-4 items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full skeleton shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32 skeleton" />
                    <Skeleton className="h-3 w-24 skeleton" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-20 skeleton" />
                <Skeleton className="h-6 w-16 rounded-md skeleton" />
                <Skeleton className="h-6 w-16 rounded-full skeleton" />
                <Skeleton className="h-6 w-6 rounded skeleton" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="h-10 w-10 text-foreground/10 mb-3" />
            <p className="font-heading font-semibold text-foreground/40">No members found</p>
            <p className="text-sm text-foreground/25 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border stagger">
            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_48px] gap-4 px-5 py-3.5 items-center hover:bg-tint/[0.025] transition-colors animate-fade-in"
              >
                {/* Member */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-indigo/20">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs font-heading font-bold">
                      {user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/85 truncate">{user.fullName}</p>
                    <p className="text-xs text-white/35 truncate font-mono">{user.email}</p>
                  </div>
                </div>

                {/* Department */}
                <span className="text-sm text-white/45 truncate">{user.department ?? '—'}</span>

                {/* Role */}
                <div className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium w-fit',
                  user.role === 'COMPANY_ADMIN'
                    ? 'bg-violet/15 text-violet border border-violet/20'
                    : 'bg-white/[0.06] text-white/50 border border-white/[0.08]')}>
                  {user.role === 'COMPANY_ADMIN' && <Shield className="h-3 w-3" />}
                  {user.role === 'COMPANY_ADMIN' ? 'Admin' : 'Employee'}
                </div>

                {/* Status */}
                <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium w-fit', STATUS_STYLES[user.status] ?? STATUS_STYLES['INACTIVE'])}>
                  <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse-glow', STATUS_DOT[user.status] ?? 'bg-white/20')} />
                  {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-foreground/30 hover:text-foreground hover:bg-tint/[0.08] rounded-lg"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass-elevated border-border rounded-xl shadow-modal w-44" align="end">

                    {/* PENDING → only resend invitation */}
                    {user.status === 'PENDING' && (
                      <DropdownMenuItem
                        disabled={resendMutation.isPending}
                        onClick={() => resendMutation.mutate(user.id)}
                        className="rounded-lg cursor-pointer text-sm text-indigo hover:bg-indigo/10 gap-2"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {resendMutation.isPending ? 'Sending…' : 'Resend Invitation'}
                      </DropdownMenuItem>
                    )}

                    {/* ACTIVE → disable */}
                    {user.status === 'ACTIVE' && (
                      <DropdownMenuItem
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: user.id, status: 'DISABLED' })}
                        className="rounded-lg cursor-pointer text-sm text-danger hover:bg-danger/10 gap-2"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Disable Account
                      </DropdownMenuItem>
                    )}

                    {/* DISABLED / INACTIVE → activate */}
                    {(user.status === 'DISABLED' || user.status === 'INACTIVE') && (
                      <DropdownMenuItem
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: user.id, status: 'ACTIVE' })}
                        className="rounded-lg cursor-pointer text-sm text-success hover:bg-success/10 gap-2"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Activate Account
                      </DropdownMenuItem>
                    )}

                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        </div>{/* min-w */}
        </div>{/* overflow-x-auto */}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-xs text-foreground/30">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 px-3 text-xs text-foreground/50 hover:text-foreground hover:bg-tint/[0.08] rounded-lg disabled:opacity-30">
                Prev
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-3 text-xs text-foreground/50 hover:text-foreground hover:bg-tint/[0.08] rounded-lg disabled:opacity-30">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="glass-elevated border-white/[0.09] rounded-2xl shadow-modal max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo" /> Invite Team Member
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {[
              { key: 'email',       label: 'Work Email',    placeholder: 'jane@company.com',     type: 'email' },
              { key: 'fullName',    label: 'Full Name',     placeholder: 'Jane Smith',           type: 'text' },
              { key: 'department',  label: 'Department',    placeholder: 'Engineering (optional)',type: 'text' },
              { key: 'designation', label: 'Designation',   placeholder: 'Software Engineer',    type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</Label>
                <Input
                  type={type}
                  placeholder={placeholder}
                  value={inviteForm[key as keyof typeof inviteForm]}
                  onChange={(e) => setInviteForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}
              className="text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={!inviteForm.email || !inviteForm.fullName || inviteMutation.isPending}
              className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm"
            >
              {inviteMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending…</>
                : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
