import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Zap, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import type { ApiResponse } from '@/types';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

interface InviteInfo { companyName: string; email: string }

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ['invite', token],
    queryFn: () =>
      api.get<ApiResponse<InviteInfo>>(`/auth/invite/${token}`).then((r) => r.data.data),
    enabled: !!token,
    retry: false,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const acceptMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post<ApiResponse<{ user: object; company: object; accessToken: string }>>('/auth/accept-invite', {
        token,
        ...data,
      }),
    onSuccess: (res) => {
      const { user, company, accessToken } = res.data.data;
      setAuth(user as never, company as never, accessToken);
      setAccepted(true);
      setTimeout(() => navigate('/projects'), 1800);
    },
  });

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center max-w-sm animate-scale-in space-y-4">
          <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto glow-success">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-white">Welcome aboard!</h2>
          <p className="text-sm text-white/40">Redirecting to your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center px-4 py-12">
      {/* Orbs */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo/15 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-violet/12 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[420px] animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Zap className="h-5 w-5 text-white" fill="white" />
          </div>
          <span className="font-heading font-bold text-xl text-white">Taskify</span>
        </div>

        <div className="glass rounded-2xl p-8 shadow-modal">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto skeleton" />
              <Skeleton className="h-6 w-48 mx-auto skeleton" />
              <Skeleton className="h-4 w-64 mx-auto skeleton" />
              <Skeleton className="h-11 w-full skeleton" />
              <Skeleton className="h-11 w-full skeleton" />
            </div>
          ) : isError ? (
            <div className="text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-danger/15 flex items-center justify-center mx-auto">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="font-heading font-bold text-xl text-white">Invalid Invitation</h2>
              <p className="text-sm text-white/40">This invitation link has expired or is invalid.</p>
              <Button onClick={() => navigate('/login')}
                className="w-full bg-gradient-primary text-white rounded-lg h-11 shimmer">
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              {/* Company badge */}
              <div className="text-center mb-6">
                <div className="h-14 w-14 rounded-2xl bg-indigo/20 border border-indigo/30 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-6 w-6 text-indigo" />
                </div>
                <h1 className="font-heading font-bold text-2xl text-white mb-1">
                  Join{' '}
                  <span className="text-gradient">{invite?.companyName}</span>
                </h1>
                <p className="text-sm text-white/40">
                  Invited as <span className="text-white/60 font-mono text-xs">{invite?.email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit((d) => acceptMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Full Name</Label>
                  <Input
                    {...register('fullName')}
                    placeholder="Your name"
                    className={cn('h-11 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/50 rounded-lg', errors.fullName && 'border-danger')}
                  />
                  {errors.fullName && <p className="text-xs text-danger">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Set Password</Label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className={cn('h-11 bg-background border-white/[0.08] text-white placeholder:text-white/20 pr-10 focus:border-indigo focus:ring-1 focus:ring-indigo/50 rounded-lg', errors.password && 'border-danger')}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
                </div>

                {acceptMutation.isError && (
                  <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5 text-sm text-danger">
                    {(acceptMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to accept invitation'}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={acceptMutation.isPending}
                  className="w-full h-11 bg-gradient-primary text-white font-semibold rounded-lg shimmer shadow-glow-sm hover:shadow-glow transition-all active:scale-[0.97]"
                >
                  {acceptMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Joining…</>
                    : 'Accept & Join Workspace'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
