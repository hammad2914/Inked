import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { useDemoLogin } from '@/hooks/useDemoLogin';
import { AuthSheet, FieldError } from '@/components/AuthSheet';
import type { ApiResponse, Company, User } from '@/types';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const demo = useDemoLogin();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await api.post<ApiResponse<{ user: User; company: Company; accessToken: string }>>('/auth/login', data);
      const { user, company, accessToken } = res.data.data;
      setAuth(user, company, accessToken);
      navigate(user.role === 'COMPANY_ADMIN' || user.role === 'SUPER_ADMIN' ? '/dashboard' : '/my-tasks');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError('root', { message: e.response?.data?.message ?? 'That email and password did not match.' });
    }
  };

  return (
    <AuthSheet title="Sign in" note="no account? the demo company is one click away">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" className="field" type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" className="field pr-10" type={showPass ? 'text' : 'password'} autoComplete="current-password" {...register('password')} />
            <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite hover:text-print">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>
        {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting} className="btn-ink h-11 w-full">
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 border-t border-rule pt-5">
        <button type="button" onClick={demo.start} disabled={demo.loading} className="btn-pen h-11 w-full">
          {demo.loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening the demo…</> : 'Open the demo company'}
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Signs you in as its admin. The demo data is rebuilt each time.</p>
        {demo.error && <p className="mt-2 text-center text-xs text-danger">{demo.error}</p>}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Starting a company planner? <Link to="/register" className="font-semibold text-print underline underline-offset-2">Create one</Link>
      </p>
    </AuthSheet>
  );
}
