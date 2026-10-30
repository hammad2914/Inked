import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import type { ApiResponse } from '@/types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setDemoError('');
    try {
      const res = await axios.get<ApiResponse<{ user: { role: string }; company: object; accessToken: string }>>(
        `${API_URL}/api/demo/login`,
        { withCredentials: true },
      );
      const { user, company, accessToken } = res.data.data;
      setAuth(user as never, company as never, accessToken);
      navigate('/dashboard');
    } catch {
      setDemoError('Demo unavailable, try again');
    } finally {
      setDemoLoading(false);
    }
  };

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await api.post<ApiResponse<{ user: { role: string }; company: object; accessToken: string }>>('/auth/login', data);
      const { user, company, accessToken } = res.data.data;
      setAuth(user as never, company as never, accessToken);
      const dest = (user.role === 'COMPANY_ADMIN' || user.role === 'SUPER_ADMIN') ? '/dashboard' : '/my-tasks';
      navigate(dest);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError('root', { message: e.response?.data?.message ?? 'Invalid credentials' });
    }
  };

  return (
    <div className="flex min-h-screen bg-base">
      {/* ── Left: Form ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-[400px] animate-fade-up">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-heading font-bold text-xl text-white">Taskify</span>
          </div>

          <h1 className="font-heading font-bold text-3xl text-white mb-2">Welcome back</h1>
          <p className="text-white/40 text-sm mb-8">Sign in to your workspace to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Email</Label>
              <Input
                {...register('email')}
                type="email"
                placeholder="you@company.com"
                className={cn(
                  'h-11 bg-surface border-white/[0.08] text-white placeholder:text-white/20',
                  'focus:border-indigo focus:ring-1 focus:ring-indigo/50 rounded-lg transition-all',
                  errors.email && 'border-danger focus:border-danger focus:ring-danger/50',
                )}
              />
              {errors.email && (
                <p className="text-xs text-danger animate-fade-in">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Password</Label>
                <span className="text-xs text-indigo hover:text-indigo-light cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    'h-11 bg-surface border-white/[0.08] text-white placeholder:text-white/20 pr-10',
                    'focus:border-indigo focus:ring-1 focus:ring-indigo/50 rounded-lg transition-all',
                    errors.password && 'border-danger focus:border-danger focus:ring-danger/50',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-danger animate-fade-in">{errors.password.message}</p>
              )}
            </div>

            {/* Root error */}
            {errors.root && (
              <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5 text-sm text-danger animate-fade-in">
                {errors.root.message}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-gradient-primary text-white font-semibold rounded-lg shimmer shadow-glow-sm hover:shadow-glow transition-all active:scale-[0.97]"
            >
              {isSubmitting
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in…</>
                : <><span>Sign in</span><ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo hover:text-indigo-light font-medium transition-colors">
              Create workspace
            </Link>
          </p>

          {/* Separator */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-white/25 font-mono">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Demo login */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full h-11 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl py-3 shimmer shadow-glow-sm hover:shadow-glow transition-all active:scale-[0.97]"
            >
              {demoLoading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Setting up demo…</>
                : <><Zap className="h-4 w-4 mr-2" fill="currentColor" /> Try Demo — One Click</>}
            </Button>
            <p className="text-center text-[11px] text-white/25">
              No signup required · Fresh data on every demo reset
            </p>
            {demoError && (
              <p className="text-center text-xs text-danger animate-fade-in">{demoError}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Brand panel ── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-mesh">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo/20 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-violet/20 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-cyan/15 blur-2xl" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div />
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo/30 bg-indigo/10 px-3 py-1.5 text-xs font-medium text-indigo">
              <Zap className="h-3 w-3" /> Enterprise Project Management
            </div>
            <h2 className="font-heading font-bold text-4xl text-white leading-tight">
              Manage teams,<br />
              <span className="text-gradient">deliver results.</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              Taskify gives you real-time visibility into every project, deadline, and team member — all in one enterprise-grade workspace.
            </p>

            {/* Stats row */}
            <div className="flex gap-6 pt-2">
              {[['99.9%', 'Uptime'], ['< 50ms', 'Response'], ['SOC 2', 'Certified']].map(([val, lbl]) => (
                <div key={lbl}>
                  <p className="font-heading font-bold text-lg text-white">{val}</p>
                  <p className="text-xs text-white/35">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="glass rounded-2xl p-5 max-w-sm">
            <p className="text-sm text-white/70 leading-relaxed italic">
              "Taskify transformed how our 200-person team ships product. Real-time updates, clear ownership, zero chaos."
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
                SJ
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Sarah J.</p>
                <p className="text-[11px] text-white/35">VP Engineering, Acme Corp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
