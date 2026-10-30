import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { AuthSheet, FieldError } from '@/components/AuthSheet';
import type { ApiResponse, Company, User } from '@/types';

const schema = z.object({
  companyName: z.string().min(2, 'Enter your company name'),
  fullName:    z.string().min(2, 'Enter your name'),
  email:       z.string().email('Enter a valid email'),
  password:    z.string().min(8, 'Use at least 8 characters'),
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
      const res = await api.post<ApiResponse<{ user: User; company: Company; accessToken: string }>>('/auth/register', data);
      const { user, company, accessToken } = res.data.data;
      setAuth(user, company, accessToken);
      navigate('/dashboard'); // registering always makes you the company admin
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError('root', { message: e.response?.data?.message ?? 'The company could not be created.' });
    }
  };

  return (
    <AuthSheet title="New planner" note="you'll be the admin. invite your team after">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="companyName">Company</label>
          <input id="companyName" className="field" placeholder="Your company's name" {...register('companyName')} />
          <FieldError message={errors.companyName?.message} />
        </div>
        <div>
          <label className="field-label" htmlFor="fullName">Your name</label>
          <input id="fullName" className="field" autoComplete="name" {...register('fullName')} />
          <FieldError message={errors.fullName?.message} />
        </div>
        <div>
          <label className="field-label" htmlFor="email">Work email</label>
          <input id="email" className="field" type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" className="field pr-10" type={showPass ? 'text' : 'password'} autoComplete="new-password" {...register('password')} />
            <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite hover:text-print">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>
        {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting} className="btn-ink h-11 w-full">
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create the planner'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have one? <Link to="/login" className="font-semibold text-print underline underline-offset-2">Sign in</Link>
      </p>
    </AuthSheet>
  );
}
