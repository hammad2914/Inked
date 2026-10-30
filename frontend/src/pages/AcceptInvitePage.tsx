import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthSheet, FieldError } from '@/components/AuthSheet';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types';

const schema = z.object({
  fullName: z.string().min(2, 'Your name is needed'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

interface InviteInfo { companyName: string; email: string }

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

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
      navigate('/my-tasks');
    },
  });

  if (isLoading) {
    return (
      <AuthSheet title="Joining" note="reading the invitation">
        <div className="space-y-4">
          <Skeleton className="skeleton h-5 w-56" />
          <Skeleton className="skeleton h-11 w-full" />
          <Skeleton className="skeleton h-11 w-full" />
        </div>
      </AuthSheet>
    );
  }

  if (isError || !invite) {
    return (
      <AuthSheet title="Invite used up" note="ask whoever invited you to send a fresh link">
        <p className="text-sm text-muted-foreground">This invitation has expired, or it was already accepted.</p>
        <Link to="/login" className="btn-ink mt-6 h-11 w-full">Go to sign in</Link>
      </AuthSheet>
    );
  }

  return (
    <AuthSheet title={`Join ${invite.companyName}`} note="once you're in, your tasks show up in pencil until you agree to the dates">
      <p className="mb-5 text-sm text-muted-foreground">
        Invited as <span className="font-mono text-xs text-print">{invite.email}</span>
      </p>
      <form onSubmit={handleSubmit((d) => acceptMutation.mutate(d))} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="i-name">Your name</label>
          <input id="i-name" {...register('fullName')} className="field" autoComplete="name" />
          <FieldError message={errors.fullName?.message} />
        </div>
        <div>
          <label className="field-label" htmlFor="i-pass">Choose a password</label>
          <div className="relative">
            <input id="i-pass" {...register('password')} type={showPass ? 'text' : 'password'} className="field pr-10" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-print">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        {acceptMutation.isError && (
          <p className="text-sm text-danger">
            {(acceptMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'The invitation could not be accepted.'}
          </p>
        )}

        <button type="submit" disabled={acceptMutation.isPending} className="btn-ink h-11 w-full">
          {acceptMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</> : 'Join the planner'}
        </button>
      </form>
    </AuthSheet>
  );
}
