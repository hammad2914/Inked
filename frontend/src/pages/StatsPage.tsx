import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

function useForceDark() {
  useEffect(() => {
    const html = document.documentElement;
    const had = { dark: html.classList.contains('dark'), light: html.classList.contains('light') };
    html.classList.add('dark');
    html.classList.remove('light');
    return () => {
      html.classList.toggle('dark', had.dark);
      html.classList.toggle('light', had.light);
    };
  }, []);
}
import {
  Building2, Users, FolderKanban, CheckSquare,
  BarChart3, FileText, TrendingUp, Zap, ArrowLeft,
  Github, ExternalLink,
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

interface PublicStats {
  totalCompanies: number;
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  reportsGenerated: number;
  completionRate: number;
  avgTasksPerProject: number;
  lastUpdated: string;
}

function useCountUp(target: number, duration = 2000) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!ref.current || target === 0) return;

    const el = ref.current;
    let current = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return ref;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  delay?: number;
}

function StatCard({ icon, value, label, suffix = '', delay = 0 }: StatCardProps) {
  const numRef = useCountUp(value);

  return (
    <div
      className="bg-[#121929] border border-white/10 rounded-2xl p-6 flex flex-col gap-3 animate-fade-up hover:border-indigo/30 hover:-translate-y-0.5 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo/10 text-indigo">
        {icon}
      </div>
      <div>
        <div className="font-heading font-bold text-3xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          <span ref={numRef}>0</span>{suffix}
        </div>
        <p className="text-sm text-white/40 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  let text = 'Just now';
  if (diffSec > 60) text = `${Math.floor(diffSec / 60)} minute${Math.floor(diffSec / 60) !== 1 ? 's' : ''} ago`;
  if (diffSec > 3600) text = `${Math.floor(diffSec / 3600)} hour${Math.floor(diffSec / 3600) !== 1 ? 's' : ''} ago`;
  return <span>{text}</span>;
}

export function StatsPage() {
  useForceDark();
  const { data, isLoading } = useQuery<PublicStats>({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const res = await axios.get<{ data: PublicStats }>(`${API_URL}/api/dashboard/public-stats`);
      return res.data.data;
    },
    refetchInterval: 30_000,
  });

  const stats = data ?? {
    totalCompanies: 0, totalUsers: 0, totalProjects: 0,
    totalTasks: 0, completedTasks: 0, reportsGenerated: 0,
    completionRate: 0, avgTasksPerProject: 0, lastUpdated: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white">
      {/* Ambient orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-indigo/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo/30">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-heading font-bold text-2xl text-white">Taskify</span>
          </div>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live Data
          </div>

          <h1 className="font-heading font-bold text-4xl md:text-5xl text-white mb-3">
            Live Platform Statistics
          </h1>
          <p className="text-white/40 text-base max-w-md mx-auto">
            Real-time numbers from the Taskify platform — updated every 30 seconds.
          </p>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#121929] border border-white/10 rounded-2xl p-6 h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Building2 className="h-5 w-5" />}    value={stats.totalCompanies}    label="Companies"            delay={0}   />
            <StatCard icon={<Users className="h-5 w-5" />}         value={stats.totalUsers}         label="Active Users"          delay={60}  />
            <StatCard icon={<FolderKanban className="h-5 w-5" />}  value={stats.totalProjects}      label="Projects Created"      delay={120} />
            <StatCard icon={<CheckSquare className="h-5 w-5" />}   value={stats.totalTasks}         label="Total Tasks"           delay={180} />
            <StatCard icon={<BarChart3 className="h-5 w-5" />}     value={stats.completedTasks}     label="Tasks Completed"       delay={240} />
            <StatCard icon={<TrendingUp className="h-5 w-5" />}    value={stats.completionRate}     label="Completion Rate"       suffix="%" delay={300} />
            <StatCard icon={<FileText className="h-5 w-5" />}      value={stats.reportsGenerated}   label="AI Reports Generated"  delay={360} />
            <StatCard icon={<Zap className="h-5 w-5" />}           value={stats.avgTasksPerProject} label="Avg Tasks / Project"   delay={420} />
          </div>
        )}

        {/* Last updated */}
        <p className="text-center text-xs text-white/25 mt-6 font-mono">
          Last updated: {data ? <RelativeTime iso={data.lastUpdated} /> : '—'}
          {' · '}Auto-refreshes every 30 s
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-14">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-lg shadow-indigo/25"
          >
            <Zap className="h-4 w-4" /> Back to App
          </Link>
          <a
            href="https://github.com/hammad2914/Taskify-Frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500 px-5 py-2.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-all"
          >
            <Github className="h-4 w-4" /> Frontend Repo
          </a>
          <a
            href="https://github.com/hammad2914/Taskify-Backend"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-violet-500 px-5 py-2.5 text-sm font-semibold text-violet-400 hover:bg-violet-500/10 transition-all"
          >
            <Github className="h-4 w-4" /> Backend Repo
          </a>
          <Link
            to="/case-study"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo/20 bg-indigo/[0.06] px-6 py-3 text-sm font-semibold text-indigo hover:bg-indigo/10 transition-all"
          >
            <ExternalLink className="h-4 w-4" /> Case Study
          </Link>
        </div>

        {/* Footer nav */}
        <div className="flex justify-center mt-10">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
