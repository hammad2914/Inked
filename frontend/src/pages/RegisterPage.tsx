import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Zap, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import type { ApiResponse } from '@/types';

const schema = z.object({
  companyName: z.string().min(2, 'Company name required'),
  fullName:    z.string().min(2, 'Full name required'),
  email:       z.string().email('Invalid email'),
  password:    z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await api.post<ApiResponse<{ user: object; company: object; accessToken: string }>>('/auth/register', data);
      const { user, company, accessToken } = res.data.data;
      setAuth(user as never, company as never, accessToken);
      navigate('/dashboard'); // register always creates COMPANY_ADMIN
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError('root', { message: e.response?.data?.message ?? 'Registration failed' });
    }
  };

  return (
    <div className="flex min-h-screen bg-base">
      {/* ── Left: Brand panel ── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-mesh">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-violet/20 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full bg-indigo/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-heading font-bold text-xl text-white">Taskify</span>
          </div>

          <div className="space-y-5">
            <h2 className="font-heading font-bold text-4xl text-white leading-tight">
              Set up your<br />
              <span className="text-gradient">enterprise workspace</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              Get your team up and running in minutes. Invite members, create projects, and start tracking tasks immediately.
            </p>

            {/* Feature list */}
            <div className="space-y-3 pt-2">
              {[
                ['Real-time collaboration', 'See updates as they happen across your team'],
                ['Role-based access control', 'Admin, project manager, and member roles'],
                ['AI-powered reports', 'Instant project insights powered by Gemini'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-indigo/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{title}</p>
                    <p className="text-xs text-white/35">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 max-w-sm">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Building2 className="h-3.5 w-3.5 text-indigo" />
              <span>Trusted by 500+ companies worldwide</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-[420px] animate-fade-up">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-heading font-bold text-xl text-white">Taskify</span>
          </div>

          <h1 className="font-heading font-bold text-3xl text-white mb-2">Create workspace</h1>
          <p className="text-white/40 text-sm mb-8">Set up your company and admin account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Company Name</Label>
              <Input
                {...register('companyName')}
                placeholder="Acme Corporation"
                className={cn('h-11 bg-surface border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/50 rounded-lg', errors.companyName && 'border-danger')}
              />
              {errors.companyName && <p className="text-xs text-danger">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Your Full Name</Label>
              <Input
                {...register('fullName')}
                placeholder="John Smith"
                className={cn('h-11 bg-surface border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/50 rounded-lg', errors.fullName && 'border-danger')}
              />
              {errors.fullName && <p className="text-xs text-danger">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Work Email</Label>
              <Input
                {...register('email')}
                type="email"
                placeholder="john@company.com"
                className={cn('h-11 bg-surface border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/50 rounded-lg', errors.email && 'border-danger')}
              />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Password</Label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className={cn('h-11 bg-surface border-white/[0.08] text-white placeholder:text-white/20 pr-10 focus:border-indigo focus:ring-1 focus:ring-indigo/50 rounded-lg', errors.password && 'border-danger')}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>

            {errors.root && (
              <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5 text-sm text-danger">
                {errors.root.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-gradient-primary text-white font-semibold rounded-lg shimmer shadow-glow-sm hover:shadow-glow transition-all active:scale-[0.97] mt-2"
            >
              {isSubmitting
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating workspace…</>
                : <><span>Create workspace</span><ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo hover:text-indigo-light font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
