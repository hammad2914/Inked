import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  LayoutGrid, Users, Sparkles, Bell, Link as LinkIcon, Shield,
  Check, Star, Menu, X, ArrowRight, ChevronRight, Zap,
  Play, TrendingUp, Building2, FolderKanban, CheckSquare,
  BarChart3, FileText, ExternalLink, Github,
} from 'lucide-react';
import { Icon } from '@iconify/react';

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

// ── Force dark mode while the landing page is mounted ────────────────────────
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

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Count-up ──────────────────────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const steps = 60, duration = 1800;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(parseFloat(cur.toFixed(decimals)));
    }, duration / steps);
    return () => clearInterval(t);
  }, [active, target, decimals]);
  return decimals > 0 ? val.toFixed(decimals) : val.toLocaleString();
}

// ═══════════════════════════════════════════════════════════════════
// 1. NAVBAR
// ═══════════════════════════════════════════════════════════════════
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (id: string) => {
    document.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth' });
    setOpen(false);
  };

  const links = [
    { label: 'Features',    id: 'features'     },
    { label: 'How It Works',id: 'how-it-works'  },
    { label: 'Live Stats',  id: 'live-stats'    },
    { label: 'Pricing',     id: 'pricing'       },
  ];

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled ? 'backdrop-blur-xl bg-[#080C14]/85 border-b border-white/[0.07] shadow-xl shadow-black/30' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="font-heading font-bold text-lg text-white tracking-tight">Taskify</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <button key={l.id} onClick={() => go(l.id)}
                className="text-white/50 hover:text-white text-sm font-body transition-colors duration-200">
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/stats" className="text-white/40 hover:text-white/70 text-sm font-body px-3 py-1.5 rounded-lg transition-colors">
              Live Stats ↗
            </Link>
            <a href="/login" className="text-white/55 hover:text-white text-sm font-body px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
              Sign In
            </a>
            <a href="/register" className="shimmer px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all">
              Get Started Free
            </a>
          </div>

          <button onClick={() => setOpen(o => !o)}
            className="md:hidden text-white/60 hover:text-white p-1 transition-colors" aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className={`md:hidden overflow-hidden transition-all duration-300 ${
        open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } bg-[#0D1220]/98 backdrop-blur-xl border-b border-white/10`}>
        <div className="px-5 py-5 flex flex-col gap-4">
          {links.map(l => (
            <button key={l.id} onClick={() => go(l.id)}
              className="text-white/60 hover:text-white text-sm font-body text-left transition-colors">
              {l.label}
            </button>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
            <a href="/login"    className="text-center py-2.5 text-white/60 text-sm">Sign In</a>
            <a href="/register" className="text-center py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium">
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. HERO
// ═══════════════════════════════════════════════════════════════════
function Hero() {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const words = ['Faster.', 'Smarter.', 'Together.', 'On Time.'];
    let wi = 0, ci = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const w = words[wi]!;
      if (!deleting) {
        ci++;
        setTyped(w.slice(0, ci));
        if (ci === w.length) { deleting = true; timer = setTimeout(tick, 2200); }
        else timer = setTimeout(tick, 95);
      } else {
        ci--;
        setTyped(w.slice(0, ci));
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
        timer = setTimeout(tick, 50);
      }
    };
    timer = setTimeout(tick, 600);
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-[#080C14]" />
      <div className="absolute top-1/4  left-1/5  w-[560px] h-[560px] bg-indigo-600  blur-[140px] opacity-[0.15] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/5 w-[420px] h-[420px] bg-violet-600  blur-[140px] opacity-[0.12] rounded-full pointer-events-none" />
      <div className="absolute top-1/2  right-1/3  w-[300px] h-[300px] bg-cyan-500    blur-[120px] opacity-[0.08] rounded-full pointer-events-none" />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium mb-7">
            <Sparkles size={11} /> AI-Powered Project Management
          </div>

          <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-[4.5rem] text-white leading-[1.04] tracking-tight mb-6">
            Manage Projects.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Ship {typed}
            </span>
            <span className="text-indigo-400 animate-pulse ml-0.5">|</span>
          </h1>

          <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
            Taskify unifies your team's tasks, timelines, and AI reports in one enterprise workspace.
            Real-time collaboration with full audit trails — built for teams who ship.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
            <a href="/register" className="shimmer inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-xl shadow-indigo-500/35 hover:shadow-indigo-500/55 hover:scale-[1.02] transition-all">
              Start for Free <ArrowRight size={16} />
            </a>
            <Link to="/login" className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl border border-white/12 text-white/70 hover:text-white hover:border-white/25 hover:bg-white/[0.04] font-medium transition-all">
              <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center">
                <Play size={8} fill="currentColor" className="ml-0.5" />
              </div>
              Try Demo
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {['SOC 2 Certified', 'GDPR Ready', '99.9% Uptime', 'SSO Support'].map(b => (
              <span key={b} className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs">
                ✓ {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Dashboard mockup */}
        <div className="hidden md:flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[430px]" style={{ animation: 'float 4.5s ease-in-out infinite' }}>
            <div className="backdrop-blur-xl bg-white/[0.055] border border-white/[0.09] rounded-2xl p-5 shadow-2xl shadow-black/60">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-white text-sm font-heading font-semibold">Q1 Sprint Overview</div>
                  <div className="text-white/30 text-xs mt-0.5">Updated just now</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/20 text-emerald-400 text-xs">On Track</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {[['48','Total','text-cyan-400'],['31','Done','text-emerald-400'],['9','Review','text-amber-400']].map(([v,l,c]) => (
                  <div key={l} className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.05]">
                    <div className={`text-xl font-bold font-heading ${c}`}>{v}</div>
                    <div className="text-white/30 text-xs mt-0.5">{l}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-5">
                {[
                  ['API Authentication Module', 'bg-emerald-400', true],
                  ['Dashboard UI Components',   'bg-indigo-400',  false],
                  ['Payment Integration',        'bg-amber-400',   false],
                  ['Mobile Responsive Design',   'bg-white/20',    false],
                ].map(([task, dot, done]) => (
                  <div key={task as string} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <span className={`text-xs flex-1 ${done ? 'text-white/30 line-through' : 'text-white/60'}`}>{task}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2.5">
                  {[['AK','from-indigo-500 to-violet-500'],['SR','from-cyan-500 to-blue-500'],['MJ','from-rose-500 to-pink-500'],['TL','from-amber-500 to-orange-500']].map(([init, grad]) => (
                    <div key={init} className={`w-7 h-7 rounded-full bg-gradient-to-br ${grad} border-2 border-[#0f1624] flex items-center justify-center text-white text-[10px] font-bold`}>{init}</div>
                  ))}
                  <div className="w-7 h-7 rounded-full bg-white/8 border-2 border-[#0f1624] flex items-center justify-center text-white/40 text-[10px]">+3</div>
                </div>
                <span className="text-white/30 text-xs">7 active</span>
              </div>
            </div>

            <div className="absolute -top-4 -right-5 bg-[#121929] border border-white/[0.09] rounded-xl p-3 shadow-xl backdrop-blur-xl">
              <div className="text-white/35 text-xs mb-0.5">Velocity</div>
              <div className="text-lg font-bold font-heading text-cyan-400">↑ 24%</div>
            </div>
            <div className="absolute -bottom-4 -left-5 bg-[#121929] border border-white/[0.09] rounded-xl p-3 shadow-xl backdrop-blur-xl">
              <div className="text-white/35 text-xs mb-0.5">Tasks Today</div>
              <div className="text-base font-bold font-heading text-emerald-400">12 / 14 ✓</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. SOCIAL PROOF
// ═══════════════════════════════════════════════════════════════════
function SocialProof() {
  const logos = ['Accenture','Shopify','Figma','Stripe','Vercel','Linear','GitHub','Atlassian','Slack','Salesforce','HubSpot','Notion'];
  const doubled = [...logos, ...logos];
  return (
    <section className="py-14 border-y border-white/[0.05] bg-[#0D1220]">
      <p className="text-center text-white/30 text-xs mb-7 tracking-widest uppercase">
        Trusted by 2,000+ teams worldwide
      </p>
      <div className="overflow-hidden">
        <div className="flex gap-4 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
          {doubled.map((logo, i) => (
            <span key={i} className="inline-flex items-center flex-shrink-0 px-5 py-2 bg-white/[0.03] border border-white/[0.08] rounded-full text-sm text-white/40 hover:text-white/60 transition-colors cursor-default">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. FEATURES
// ═══════════════════════════════════════════════════════════════════
const FEATURES = [
  { icon: LayoutGrid, title: 'Project Management',   desc: 'Kanban boards, sprint planning, and Gantt-style timelines — adapt to any workflow in seconds.',      gradient: 'from-indigo-500 to-violet-500', glow: 'rgba(99,102,241,0.15)' },
  { icon: Users,      title: 'Team Collaboration',   desc: 'Real-time updates, @mentions, and threaded comments keep your whole team perfectly aligned.',          gradient: 'from-cyan-500 to-blue-500',   glow: 'rgba(6,182,212,0.15)'   },
  { icon: Sparkles,   title: 'AI-Powered Reports',   desc: 'Auto-generate executive summaries and risk analysis reports with a single click. No more manual status updates.', gradient: 'from-violet-500 to-pink-500', glow: 'rgba(139,92,246,0.15)' },
  { icon: Bell,       title: 'Smart Notifications',  desc: 'Intelligent alerts surface exactly what matters and suppress noise. Timeline changes trigger instant team notifications.', gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.15)' },
  { icon: LinkIcon,   title: 'HR Integration',       desc: 'Sync with BambooHR, Workday, and more. Roles and permissions update automatically when your org changes.',  gradient: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.15)' },
  { icon: Shield,     title: 'Role-Based Access',    desc: 'Granular company and project-level permissions. Multi-tenant isolation ensures zero cross-company data leaks.', gradient: 'from-rose-500 to-pink-500', glow: 'rgba(239,68,68,0.15)' },
];

function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState<boolean[]>(FEATURES.map(() => false));

  useEffect(() => {
    const cards = containerRef.current?.querySelectorAll('[data-card]');
    if (!cards) return;
    const obs: IntersectionObserver[] = [];
    cards.forEach((card, idx) => {
      const o = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setVis(p => { const n=[...p]; n[idx]=true; return n; }), idx * 80);
          o.disconnect();
        }
      }, { threshold: 0.1 });
      o.observe(card);
      obs.push(o);
    });
    return () => obs.forEach(o => o.disconnect());
  }, []);

  return (
    <section id="features" className="py-28 bg-[#080C14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-5">
            <LayoutGrid size={11} /> Features
          </div>
          <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-5">
            Everything your team needs
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto leading-relaxed">
            Built for modern engineering and product teams who ship fast and need clarity at every level.
          </p>
        </div>

        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {FEATURES.map((feat, idx) => {
            const FIcon = feat.icon;
            return (
              <div
                key={feat.title}
                data-card
                className={`group relative bg-[#0D1220] border border-white/[0.07] rounded-2xl p-6 overflow-hidden
                  hover:-translate-y-2 transition-all duration-500 cursor-default
                  ${vis[idx] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{
                  transitionDelay: `${idx * 70}ms`,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.04)`,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${feat.glow}, 0 0 0 1px rgba(255,255,255,0.08)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px rgba(255,255,255,0.04)`; }}
              >
                {/* Gradient top strip */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{ boxShadow: `0 0 20px ${feat.glow}` }}>
                  <FIcon size={20} className="text-white" />
                </div>
                <h3 className="font-heading font-semibold text-white text-lg mb-2.5">{feat.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5. HOW IT WORKS
// ═══════════════════════════════════════════════════════════════════
const STEPS = [
  { num: '01', icon: Users,      title: 'Invite Your Team',  desc: 'Import from HR systems or invite directly. Roles are assigned automatically from your org structure.' },
  { num: '02', icon: LayoutGrid, title: 'Create Projects',   desc: 'Set milestones, assign tasks with timelines, and track progress with real-time Kanban views.' },
  { num: '03', icon: Sparkles,   title: 'Generate Insights', desc: 'AI-powered reports summarize progress, surface risks, and send automated stakeholder updates.' },
];

function HowItWorks() {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <section id="how-it-works" className="py-28 bg-[#0D1220]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium mb-5">
            <ChevronRight size={11} /> How It Works
          </div>
          <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-5">
            Up and running in minutes
          </h2>
          <p className="text-white/45 text-lg max-w-md mx-auto">
            No lengthy onboarding. Three steps and your team is shipping.
          </p>
        </div>

        <div ref={ref} className={`relative grid grid-cols-1 md:grid-cols-3 gap-10 mt-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="hidden md:block absolute top-8 border-t border-dashed border-indigo-500/20" style={{ left:'20%', right:'20%' }} />
          {STEPS.map((s, i) => {
            const SIcon = s.icon;
            return (
              <div key={s.num} className="relative flex flex-col items-center text-center" style={{ transitionDelay: `${i*150}ms` }}>
                <div className="relative mb-6 z-10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/35">
                    <SIcon size={26} className="text-white" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#0D1220] border border-indigo-500/40 flex items-center justify-center">
                    <span className="text-indigo-400 text-[10px] font-bold font-heading">{s.num}</span>
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-white text-xl mb-3">{s.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6. LIVE PLATFORM STATS (from real API)
// ═══════════════════════════════════════════════════════════════════
interface PublicStats {
  totalCompanies: number; totalUsers: number; totalProjects: number;
  totalTasks: number; completedTasks: number; reportsGenerated: number;
  completionRate: number; avgTasksPerProject: number; lastUpdated: string;
}

interface LiveStatCardProps {
  icon: React.ReactNode; value: number; suffix?: string;
  label: string; active: boolean; delay: number; decimals?: number;
}

function LiveStatCard({ icon, value, suffix = '', label, active, delay, decimals = 0 }: LiveStatCardProps) {
  const display = useCountUp(value, active, decimals);
  return (
    <div className={`bg-[#0D1220] border border-white/[0.07] rounded-2xl p-6 text-center transition-all duration-700 hover:border-indigo-500/25 hover:-translate-y-1`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex justify-center mb-3 text-indigo-400/70">{icon}</div>
      <div className="font-heading font-bold text-3xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1.5">
        {display}{suffix}
      </div>
      <div className="text-white/40 text-sm">{label}</div>
    </div>
  );
}

function LiveStats() {
  const { ref, visible } = useScrollReveal(0.15);
  const { data } = useQuery<PublicStats>({
    queryKey: ['public-stats-landing'],
    queryFn: () => axios.get<{ data: PublicStats }>(`${API_URL}/api/dashboard/public-stats`).then(r => r.data.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const stats = data ?? { totalCompanies:0, totalUsers:0, totalProjects:0, totalTasks:0,
    completedTasks:0, reportsGenerated:0, completionRate:0, avgTasksPerProject:0, lastUpdated: '' };

  const cards = [
    { icon: <Building2 size={22} />,    value: stats.totalCompanies,    label: 'Companies',            suffix: '' },
    { icon: <Users size={22} />,         value: stats.totalUsers,         label: 'Active Users',         suffix: '' },
    { icon: <FolderKanban size={22} />,  value: stats.totalProjects,      label: 'Projects Created',     suffix: '' },
    { icon: <CheckSquare size={22} />,   value: stats.completedTasks,     label: 'Tasks Completed',      suffix: '' },
    { icon: <TrendingUp size={22} />,    value: stats.completionRate,     label: 'Completion Rate',      suffix: '%' },
    { icon: <BarChart3 size={22} />,     value: stats.totalTasks,         label: 'Total Tasks',          suffix: '' },
    { icon: <FileText size={22} />,      value: stats.reportsGenerated,   label: 'AI Reports Generated', suffix: '' },
    { icon: <Zap size={22} />,           value: stats.avgTasksPerProject, label: 'Avg Tasks / Project',  suffix: '' },
  ];

  return (
    <section id="live-stats" className="py-28 bg-[#080C14] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600 blur-[160px] opacity-[0.06] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live Platform Data
          </div>
          <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-5">
            Trusted at scale
          </h2>
          <p className="text-white/45 text-lg max-w-md mx-auto">
            Real numbers from our production database, updated every minute.
          </p>
        </div>

        <div ref={ref} className={`grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {cards.map((c, i) => (
            <LiveStatCard key={c.label} {...c} active={visible} delay={i * 60} />
          ))}
        </div>

        <div className="text-center mt-6">
          <Link to="/stats" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-indigo-400 transition-colors">
            View full stats dashboard <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 7. DASHBOARD BENTO PREVIEW
// ═══════════════════════════════════════════════════════════════════
function DashboardPreview() {
  const { ref, visible } = useScrollReveal(0.05);
  return (
    <section className="py-28 bg-[#0D1220]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-5">Your command center</h2>
          <p className="text-white/45 text-lg max-w-md mx-auto">
            A living dashboard that updates in real-time as your team works.
          </p>
        </div>

        <div ref={ref} className={`grid gap-4 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {/* Line chart */}
          <div className="col-span-3 md:col-span-2 bg-[#121929] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-white text-sm">Velocity Trend</h3>
                <p className="text-white/35 text-xs mt-0.5">Tasks completed per week</p>
              </div>
              <span className="text-cyan-400 text-sm font-semibold bg-cyan-400/8 px-2.5 py-1 rounded-full border border-cyan-400/15">↑ 18%</span>
            </div>
            <svg viewBox="0 0 400 100" className="w-full h-28" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient>
                <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient>
              </defs>
              <path d="M0,82 L55,70 L110,74 L165,44 L220,57 L275,30 L330,40 L400,18 L400,100 L0,100 Z" fill="url(#lg2)" />
              <polyline points="0,82 55,70 110,74 165,44 220,57 275,30 330,40 400,18" fill="none" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {([0,55,110,165,220,275,330,400] as number[]).map((x, i) => {
                const ys = [82,70,74,44,57,30,40,18];
                return <circle key={i} cx={x} cy={ys[i]!} r="3.5" fill="#6366f1" />;
              })}
            </svg>
            <div className="flex justify-between mt-1 px-0.5">
              {['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5','Wk 6','Wk 7','Wk 8'].map(w => (
                <span key={w} className="text-white/20 text-[9px]">{w}</span>
              ))}
            </div>
          </div>

          {/* Donut */}
          <div className="col-span-3 md:col-span-1 bg-[#121929] border border-white/[0.06] rounded-2xl p-5 flex flex-col">
            <h3 className="font-heading font-semibold text-white text-sm mb-0.5">Task Status</h3>
            <p className="text-white/35 text-xs mb-5">This Sprint</p>
            <div className="flex items-center gap-5 flex-1">
              <div className="w-24 h-24 rounded-full flex-shrink-0" style={{
                background: 'conic-gradient(#6366f1 0% 65%, #8b5cf6 65% 82%, #06b6d4 82% 92%, rgba(255,255,255,0.05) 92% 100%)',
                WebkitMask: 'radial-gradient(farthest-side, transparent 52%, black 52%)',
                mask: 'radial-gradient(farthest-side, transparent 52%, black 52%)',
              }} />
              <div className="space-y-2 flex-1">
                {[['Done','65%','bg-indigo-500'],['In Progress','17%','bg-violet-500'],['Review','10%','bg-cyan-500'],['Todo','8%','bg-white/10']].map(([l,p,c]) => (
                  <div key={l} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c}`} />
                    <span className="text-white/50 text-xs flex-1">{l}</span>
                    <span className="text-white/30 text-xs">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="col-span-3 md:col-span-1 bg-[#121929] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="font-heading font-semibold text-white text-sm mb-0.5">Active Members</h3>
            <p className="text-white/35 text-xs mb-4">4 online now</p>
            <div className="flex -space-x-3 mb-3">
              {[['AK','from-indigo-500 to-violet-500'],['SR','from-cyan-500 to-blue-500'],['MJ','from-rose-500 to-pink-500'],['TL','from-amber-500 to-orange-500']].map(([i,g]) => (
                <div key={i} className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} border-2 border-[#121929] flex items-center justify-center text-white text-xs font-bold`}>{i}</div>
              ))}
            </div>
            <span className="text-cyan-400 text-xs">+ 3 more teammates</span>
          </div>

          {/* Projects progress */}
          <div className="col-span-3 md:col-span-1 bg-[#121929] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="font-heading font-semibold text-white text-sm mb-0.5">Active Projects</h3>
            <p className="text-white/35 text-xs mb-5">2 in progress</p>
            <div className="space-y-4">
              {[['Mobile App v2',72,'from-indigo-500 to-violet-500'],['API Gateway',45,'from-violet-500 to-cyan-500']].map(([n,p,c]) => (
                <div key={n as string}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/55">{n}</span>
                    <span className="text-white/35">{p}%</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full bg-gradient-to-r ${c}`} style={{ width:`${p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="col-span-3 bg-[#121929] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="font-heading font-semibold text-white text-sm mb-4">Recent Activity</h3>
            <div className="space-y-3.5">
              {[
                { av:'AK', g:'from-indigo-500 to-violet-500', name:'Ahmed K.',    verb:'completed',       item:'User Auth Module',    time:'2m ago',  vc:'text-emerald-400' },
                { av:'SR', g:'from-cyan-500 to-blue-500',     name:'Sara R.',     verb:'commented on',    item:'Dashboard Redesign',  time:'14m ago', vc:'text-cyan-400'    },
                { av:'MJ', g:'from-rose-500 to-pink-500',     name:'Mike J.',     verb:'moved to review', item:'Payment Gateway',     time:'1h ago',  vc:'text-amber-400'   },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${row.g} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{row.av}</div>
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="text-white/75">{row.name} </span>
                    <span className={row.vc}>{row.verb} </span>
                    <span className="text-white/60 font-medium">{row.item}</span>
                  </div>
                  <span className="text-white/25 text-xs flex-shrink-0">{row.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 8. CASE STUDY TEASER
// ═══════════════════════════════════════════════════════════════════
function CaseStudyTeaser() {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <section className="py-24 bg-[#080C14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`relative rounded-3xl overflow-hidden border border-white/[0.07] transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          style={{ background: 'linear-gradient(135deg, #0D1220 0%, #0f1528 50%, #0D1220 100%)' }}
        >
          {/* Gradient decorations */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 blur-[120px] opacity-[0.15] rounded-full" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-violet-600 blur-[100px] opacity-[0.12] rounded-full" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          <div className="relative grid md:grid-cols-2 gap-12 p-10 md:p-14 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
                Case Study
              </div>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-5 leading-tight">
                Building a Production-Grade<br />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Multi-Tenant SaaS
                </span>
              </h2>
              <p className="text-white/45 leading-relaxed mb-8 text-sm">
                A deep technical walkthrough: multi-tenant data isolation, JWT security architecture,
                task state machines, real-time Socket.io rooms, and AI report generation with graceful fallbacks.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {['Multi-tenancy','JWT Security','State Machines','Socket.io','AI + Fallback'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.07] text-white/45 text-xs font-mono">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/case-study" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25">
                  Read Case Study <ArrowRight size={14} />
                </Link>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:border-white/20 transition-all">
                  <Github size={14} /> View Source
                </a>
              </div>
            </div>

            {/* Right: challenge cards */}
            <div className="space-y-3">
              {[
                { num: '01', title: 'Multi-Tenant Isolation',     desc: 'Every query scoped to companyId extracted from JWT claims',       color: 'border-indigo-500/30 bg-indigo-500/[0.04]' },
                { num: '02', title: 'JWT + HttpOnly Cookies',     desc: 'Access token in memory, refresh token never touches JS context',  color: 'border-violet-500/30 bg-violet-500/[0.04]' },
                { num: '03', title: 'Task State Machine',         desc: 'Strict transition map with immutable timeline lock post-accept',   color: 'border-cyan-500/30 bg-cyan-500/[0.04]'     },
                { num: '04', title: 'Socket.io Room Scoping',     desc: 'Company-scoped rooms prevent cross-tenant event leakage',         color: 'border-emerald-500/30 bg-emerald-500/[0.04]'},
                { num: '05', title: 'AI Report + Fallback',       desc: 'Gemini API with deterministic mock generator on failure',          color: 'border-amber-500/30 bg-amber-500/[0.04]'   },
              ].map(c => (
                <div key={c.num} className={`flex items-start gap-3 rounded-xl border p-3.5 ${c.color}`}>
                  <span className="font-mono text-xs text-white/25 mt-0.5 shrink-0">{c.num}</span>
                  <div>
                    <p className="text-white/80 text-sm font-semibold leading-none mb-1">{c.title}</p>
                    <p className="text-white/35 text-xs">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 9. PRICING
// ═══════════════════════════════════════════════════════════════════
const PLANS = [
  { name:'Starter', price:'$0', period:'Free forever', desc:'For small teams just getting started.', popular:false, href:'/register', cta:'Get Started Free',
    features:['5 projects','Up to 10 members','Basic Kanban','1 GB storage','Email support'] },
  { name:'Pro', price:'$14', period:'per user / month', desc:'For growing product and engineering teams.', popular:true, href:'/register?plan=pro', cta:'Start Pro Trial',
    features:['Unlimited projects','Unlimited members','AI reports & insights','50 GB storage','HR integrations','Priority support','Custom roles'] },
  { name:'Enterprise', price:'Custom', period:'Annual billing', desc:'For large orgs with compliance needs.', popular:false, href:'/contact', cta:'Contact Sales',
    features:['Everything in Pro','SSO & SAML','Dedicated success manager','SLA guarantee','Custom integrations','Audit logs','On-premise option'] },
];

function Pricing() {
  const { ref, visible } = useScrollReveal(0.05);
  return (
    <section id="pricing" className="py-28 bg-[#080C14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-5">
            <Star size={11} /> Pricing
          </div>
          <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-5">Simple, transparent pricing</h2>
          <p className="text-white/45 text-lg max-w-md mx-auto">Start free, scale when you're ready. No surprises, ever.</p>
        </div>

        <div ref={ref} className={`grid grid-cols-1 md:grid-cols-3 gap-7 items-center mt-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {PLANS.map((plan, idx) => (
            <div key={plan.name}
              className={`relative rounded-2xl p-7 transition-all duration-300 ${
                plan.popular
                  ? 'bg-[#0D1220] border-2 border-indigo-500 scale-[1.03] shadow-[0_0_60px_rgba(99,102,241,0.18)]'
                  : 'bg-[#0D1220] border border-white/[0.07] hover:border-white/12 hover:-translate-y-1'
              }`}
              style={{ transitionDelay:`${idx*80}ms` }}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/40 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-heading font-bold text-white text-xl mb-1.5">{plan.name}</h3>
                <p className="text-white/35 text-sm">{plan.desc}</p>
              </div>
              <div className="mb-7">
                <div className="font-heading font-bold text-5xl text-white">{plan.price}</div>
                <div className="text-white/35 text-sm mt-1">{plan.period}</div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Check size={14} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-white/60">{f}</span>
                  </li>
                ))}
              </ul>
              <a href={plan.href} className={`block w-full text-center py-3 rounded-xl font-semibold transition-all duration-200 ${
                plan.popular
                  ? 'shimmer bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]'
                  : 'border border-white/12 text-white/55 hover:text-white hover:border-white/25 hover:bg-white/[0.04]'
              }`}>{plan.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 10. TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════
const TESTIMONIALS = [
  { quote:'Taskify replaced three tools we were using. Sprint velocity went up 30% in the first month alone.', name:'Sarah Chen', role:'VP of Engineering, NovaTech', initials:'SC', grad:'from-indigo-500 to-violet-500' },
  { quote:'The AI reports are a game-changer. I used to spend 3 hours on stakeholder updates — now it\'s one click.', name:'James Okafor', role:'Product Manager, Launchpad', initials:'JO', grad:'from-cyan-500 to-blue-500' },
  { quote:'We onboarded 50 people in under an hour. The HR sync is seamless. Best investment we\'ve made this year.', name:'Priya Mehta', role:'CTO, ScaleStack', initials:'PM', grad:'from-rose-500 to-pink-500' },
];

function Testimonials() {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <section id="testimonials" className="py-28 bg-[#0D1220]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-5">Loved by teams everywhere</h2>
          <p className="text-white/40 text-lg">Real words from real customers.</p>
        </div>
        <div ref={ref} className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {TESTIMONIALS.map((t, idx) => (
            <div key={t.name}
              className="bg-[#121929] border border-white/[0.06] rounded-2xl p-6 hover:border-white/12 hover:-translate-y-1 transition-all duration-300"
              style={{ transitionDelay:`${idx*80}ms` }}>
              <div className="flex gap-1 mb-5">
                {Array.from({length:5}).map((_,i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
              </div>
              <blockquote className="text-white/60 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{t.initials}</div>
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-white/35 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 11. CTA BANNER
// ═══════════════════════════════════════════════════════════════════
function CTABanner() {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <section className="py-28 bg-[#080C14] relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600 blur-[140px] opacity-[0.15] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600 blur-[140px] opacity-[0.12] rounded-full pointer-events-none" />
      <div
        ref={ref}
        className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <h2 className="font-heading font-bold text-5xl sm:text-6xl lg:text-7xl text-white mb-6 leading-tight">
          Ready to ship{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            10x faster?
          </span>
        </h2>
        <p className="text-white/50 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Join 2,000+ teams already using Taskify. Start free today — no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/register" className="shimmer inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-lg font-semibold hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] transition-all shadow-xl shadow-indigo-500/30">
            Start for Free <ArrowRight size={20} />
          </a>
          <a href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/12 text-white/65 hover:text-white hover:border-white/25 hover:bg-white/[0.04] text-lg font-medium transition-all">
            Sign In
          </a>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 12. FOOTER
// ═══════════════════════════════════════════════════════════════════
function Footer() {
  const COLS = [
    { title:'Product',   links:['Features','Pricing','Changelog','Roadmap','Security'] },
    { title:'Company',   links:['About','Blog','Careers','Press','Contact'] },
    { title:'Resources', links:['Documentation','API Reference','Integrations','Status','Community'] },
    { title:'Legal',     links:['Privacy Policy','Terms of Service','Cookie Policy','GDPR'] },
  ];

  return (
    <footer className="bg-[#080C14] border-t border-white/[0.05] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-14">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Zap size={14} className="text-white" fill="white" />
              </div>
              <span className="font-heading font-bold text-white">Taskify</span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed mb-5 max-w-xs">
              Modern project management for high-velocity teams who ship without chaos.
            </p>
            <div className="flex gap-2.5">
              {[
                { icon:'ri:twitter-x-fill', href:'https://x.com',        label:'X' },
                { icon:'ri:linkedin-fill',   href:'https://linkedin.com', label:'LinkedIn' },
                { icon:'ri:github-fill',     href:'https://github.com',   label:'GitHub' },
              ].map(({ icon, href, label }) => (
                <a key={icon} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all">
                  <Icon icon={icon} width={14} height={14} />
                </a>
              ))}
            </div>
            {/* Extra links */}
            <div className="flex gap-3 mt-5">
              <Link to="/stats" className="text-xs text-white/25 hover:text-indigo-400 transition-colors">Live Stats</Link>
              <span className="text-white/10">·</span>
              <Link to="/case-study" className="text-xs text-white/25 hover:text-indigo-400 transition-colors">Case Study</Link>
            </div>
          </div>

          {COLS.map(col => (
            <div key={col.title}>
              <h4 className="font-heading font-semibold text-white text-sm mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-white/35 text-sm hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.05] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-sm">© 2026 Taskify, Inc. All rights reserved.</p>
          <p className="text-white/15 text-xs">Built with ♥ for teams who ship</p>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════
export function LandingPage() {
  useForceDark();

  return (
    <div className="bg-[#080C14] min-h-screen text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <LiveStats />
      <DashboardPreview />
      <CaseStudyTeaser />
      <Pricing />
      <Testimonials />
      <CTABanner />
      <Footer />
    </div>
  );
}
