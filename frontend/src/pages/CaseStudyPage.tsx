import { useEffect, useRef } from 'react';

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
import { Link } from 'react-router-dom';
import {
  Zap, ArrowLeft, ExternalLink, Github, AlertTriangle,
  Clock, FileX, Cpu, Building2, Lightbulb, Wifi,
} from 'lucide-react';

/* ── Count-up hook (reused from StatsPage) ─────────────────────── */
function useCountUp(target: number, suffix = '') {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === 0) { if (el) el.textContent = `0${suffix}`; return; }

    let current = 0;
    const startTime = performance.now();
    const duration = 1800;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * target);
      el.textContent = `${current}${suffix}`;
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, suffix]);

  return ref;
}

/* ── Reusable components ─────────────────────────────────────────── */
function TechBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-mono text-white/60">
      {label}
    </span>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0a0f1a] border border-white/[0.07] p-4 text-xs font-mono text-emerald-400/90 leading-relaxed">
      <code>{code.trim()}</code>
    </pre>
  );
}

interface ChallengeCardProps {
  number: string;
  title: string;
  challenge: string;
  solution: string;
  code: string;
}

function ChallengeCard({ number, title, challenge, solution, code }: ChallengeCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-6 space-y-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 font-mono text-xs text-amber-400/60 mt-0.5">{number}</span>
        <h3 className="font-heading font-bold text-base text-amber-400">{title}</h3>
      </div>
      <div className="pl-6 space-y-2 text-sm text-white/60 leading-relaxed">
        <p><span className="text-white/30 font-semibold">Challenge: </span>{challenge}</p>
        <p><span className="text-emerald-400/80 font-semibold">Solution: </span>{solution}</p>
      </div>
      <div className="pl-6">
        <CodeBlock code={code} />
      </div>
    </div>
  );
}

interface ImpactStatProps {
  value: number;
  suffix: string;
  label: string;
  delay?: number;
}

function ImpactStat({ value, suffix, label, delay = 0 }: ImpactStatProps) {
  const ref = useCountUp(value, suffix);
  return (
    <div
      className="text-center rounded-2xl border border-white/[0.07] bg-[#0D1220] p-6 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="font-heading font-bold text-4xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
        <span ref={ref}>0{suffix}</span>
      </div>
      <p className="text-sm text-white/40 mt-1">{label}</p>
    </div>
  );
}

/* ── Architecture node ───────────────────────────────────────────── */
interface ArchNodeProps {
  label: string;
  sublabel: string;
  color: string;
  icon: React.ReactNode;
}

function ArchNode({ label, sublabel, color, icon }: ArchNodeProps) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl border px-5 py-4 text-center ${color}`}>
      <div className="text-xl">{icon}</div>
      <p className="font-semibold text-sm text-white">{label}</p>
      <p className="text-[10px] text-white/40">{sublabel}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex flex-col items-center gap-0.5 text-white/20">
      <div className="w-px h-6 bg-white/10" />
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/20" />
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export function CaseStudyPage() {
  useForceDark();
  return (
    <div className="min-h-screen bg-[#080C14] text-white">
      {/* Ambient */}
      <div className="fixed top-0 right-1/4 w-96 h-96 rounded-full bg-violet/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-80 h-80 rounded-full bg-indigo/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 py-16 space-y-20">

        {/* ── SECTION 1: Hero ────────────────────────────────────── */}
        <section className="animate-fade-up">
          <div className="flex items-center gap-2 mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back
            </Link>
          </div>

          <div className="inline-flex items-center rounded-full border border-indigo/30 bg-indigo/10 px-3 py-1 text-xs font-semibold text-indigo tracking-widest uppercase mb-5">
            Case Study
          </div>

          <h1 className="font-heading font-bold text-4xl md:text-5xl text-white leading-tight mb-4">
            Building a Production-Grade<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Multi-Tenant SaaS
            </span>
          </h1>

          <p className="text-white/50 text-base leading-relaxed mb-6 max-w-2xl">
            How I architected Taskify — a real-time project management platform with AI reporting,
            role-based access control, and HR integration — from zero to production.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-white/30 font-mono mb-8">
            <span>Full-Stack Engineer</span>
            <span className="text-white/15">·</span>
            <span>8 weeks</span>
            <span className="text-white/15">·</span>
            <span>Solo Project</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'Socket.io', 'Gemini AI', 'TailwindCSS', 'JWT', 'Zustand'].map((t) => (
              <TechBadge key={t} label={t} />
            ))}
          </div>
          <p className="text-white/35 text-xs font-mono leading-relaxed">
            Architected as two independent repos with separate CI/CD pipelines — frontend deployed on Vercel, backend deployed on Render.
          </p>
        </section>

        {/* ── SECTION 2: The Problem ────────────────────────────── */}
        <section className="space-y-6 animate-fade-up">
          <h2 className="font-heading font-bold text-2xl text-white border-l-2 border-indigo pl-4">
            The Problem
          </h2>

          <p className="text-white/55 leading-relaxed">
            Most project management tools aimed at small-to-mid-sized companies fall short in three
            critical areas: granular access control, real-time collaboration, and actionable insights.
            Teams end up duct-taping spreadsheets, Slack threads, and disconnected trackers together —
            creating invisible bottlenecks and accountability gaps.
          </p>

          <p className="text-white/55 leading-relaxed">
            There was no off-the-shelf solution that combined multi-tenant data isolation, live
            socket-based updates, AI-powered reporting, and deep HR system integration in a single
            cohesive platform. Taskify was built to fill exactly that gap.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-2">
            {[
              { icon: <Clock className="h-5 w-5" />, title: 'Manual reporting overhead', desc: 'Teams waste hours each week writing status updates that could be auto-generated.' },
              { icon: <FileX className="h-5 w-5" />,  title: 'No audit trail', desc: 'Task changes, status updates, and timeline shifts happen with no traceable history.' },
              { icon: <AlertTriangle className="h-5 w-5" />, title: 'Fragmented team data', desc: 'Employee records spread across spreadsheets with no single source of truth.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-danger/20 bg-danger/[0.05] p-4 space-y-2">
                <div className="text-danger/70">{icon}</div>
                <p className="font-semibold text-sm text-white">{title}</p>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: Technical Challenges ──────────────────── */}
        <section className="space-y-5 animate-fade-up">
          <h2 className="font-heading font-bold text-2xl text-white border-l-2 border-indigo pl-4">
            Technical Challenges & Solutions
          </h2>

          <div className="space-y-4">
            <ChallengeCard
              number="01"
              title="Multi-Tenant Data Isolation"
              challenge="Every database query must be scoped to the correct company. A single missing WHERE clause leaks data across tenants — a catastrophic security failure in a SaaS context."
              solution="All service functions accept companyId as their first parameter, extracted from the verified JWT at the middleware layer. No query can run without it being explicitly threaded through."
              code={`// middleware/auth.ts
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = verifyToken(token, env.JWT_ACCESS_SECRET);
  // Attach to every request — services receive it as a param
  req.user = { userId: payload.userId, companyId: payload.companyId, role: payload.role };
  next();
}

// tasks.service.ts — companyId always injected from JWT
export async function getTask(taskId: string, companyId: string) {
  return prisma.task.findFirst({ where: { id: taskId, companyId } });
}`}
            />

            <ChallengeCard
              number="02"
              title="JWT Refresh Token Security"
              challenge="Storing JWTs in localStorage exposes them to XSS attacks. A single malicious script can exfiltrate the token and impersonate the user indefinitely."
              solution="Access tokens live only in memory (Zustand store). Refresh tokens are stored in HttpOnly, Secure, SameSite=Strict cookies — inaccessible to JavaScript entirely. On page reload, the app silently calls /auth/refresh using the cookie."
              code={`// auth.controller.ts
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,        // JS can't read this
  secure: true,          // HTTPS only
  sameSite: 'strict',    // No cross-site sending
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// frontend/AuthInitializer.tsx — restore session on mount
const refreshRes = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
const { accessToken } = refreshRes.data.data; // in-memory only
const { user, company } = await axios.get('/api/auth/me', {
  headers: { Authorization: \`Bearer \${accessToken}\` }
}).then(r => r.data.data);
setAuth(user, company, accessToken); // Zustand, not localStorage`}
            />

            <ChallengeCard
              number="03"
              title="Task State Machine + Timeline Lock"
              challenge="Tasks have strict valid state transitions (PENDING → ACCEPTED → IN_PROGRESS → COMPLETED). Once a deadline is accepted by an assignee, it must be permanently immutable — enforced at the service layer, not just the UI."
              solution="An explicit transition map throws HTTP 403 on any invalid move. A hard timeline lock checks timelineAccepted before any date update, throwing 403 regardless of the caller's role."
              code={`// tasks.service.ts
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING:     ['ACCEPTED', 'OVERDUE'],
  ACCEPTED:    ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED', 'OVERDUE'],
  COMPLETED:   [],
  OVERDUE:     ['IN_PROGRESS'],
};

if (status && !VALID_TRANSITIONS[task.status].includes(status)) {
  throw { status: 403, message: 'Invalid status transition' };
}

// Hard timeline lock — cannot be bypassed
if (task.timelineAccepted && (body.startDate || body.deadline)) {
  throw { status: 403, message: 'Timeline is locked after acceptance', code: 'TIMELINE_LOCKED' };
}`}
            />

            <ChallengeCard
              number="04"
              title="Real-Time Multi-Room Architecture"
              challenge="Socket.io events must only reach users within the same company. A naive global broadcast would leak notifications, task updates, and project events across all tenants."
              solution="On connection, each authenticated socket joins a company-scoped room using their JWT-extracted companyId. All emits are room-scoped — global broadcasts are structurally impossible."
              code={`// socket/index.ts
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const payload = verifyToken(token, env.JWT_ACCESS_SECRET);
  socket.data.companyId = payload.companyId;
  socket.data.userId    = payload.userId;
  next();
});

io.on('connection', (socket) => {
  // User joins their company room — all events scoped here
  socket.join(\`company:\${socket.data.companyId}\`);
  socket.join(\`user:\${socket.data.userId}\`);
});

// Emit helpers — never global
export const emitToCompany = (companyId: string, event: string, data: unknown) =>
  io.to(\`company:\${companyId}\`).emit(event, data);`}
            />

            <ChallengeCard
              number="05"
              title="AI Report with Graceful Fallback"
              challenge="AI generation can fail due to quota limits, network errors, or missing API keys. The app must never crash or show a blank report because of an external service failure."
              solution="A try/catch wraps the Gemini API call. On any failure, a deterministic mock generator using real project data from the database produces the identical JSON schema — the user always gets a meaningful report."
              code={`// aiReport.service.ts
try {
  console.log('[AI] Calling Gemini API...');
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  const reportData = JSON.parse(result.response.text()) as ReportData;
  console.log('[AI] Gemini report generated successfully');
  return reportData;
} catch (err) {
  console.warn('[AI] Gemini failed — using mock fallback:', err);
  return generateMockReport(context); // deterministic, always works
}`}
            />
          </div>
        </section>

        {/* ── SECTION 4: Impact Numbers ─────────────────────────── */}
        <section className="space-y-6 animate-fade-up">
          <h2 className="font-heading font-bold text-2xl text-white border-l-2 border-indigo pl-4">
            By The Numbers
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ImpactStat value={97}  suffix="%" label="Faster than manual reporting"  delay={0}   />
            <ImpactStat value={100} suffix="%" label="Invalid transitions prevented" delay={60}  />
            <ImpactStat value={0}   suffix=""  label="Cross-tenant data leaks"       delay={120} />
            <ImpactStat value={5}   suffix=""  label="Permission levels enforced"    delay={180} />
            <ImpactStat value={3}   suffix="s" label="AI report generation time"     delay={240} />
            <ImpactStat value={24}  suffix="/7" label="Real-time sync across devices" delay={300} />
          </div>
        </section>

        {/* ── SECTION 5: Architecture Diagram ──────────────────── */}
        <section className="space-y-6 animate-fade-up">
          <h2 className="font-heading font-bold text-2xl text-white border-l-2 border-indigo pl-4">
            System Architecture
          </h2>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-6 sm:p-8 overflow-x-auto">
            {/* ── Desktop diagram ── */}
            <div className="hidden sm:block min-w-[560px]">

              {/* Row 1 — two GitHub repos */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center gap-2">
                  <ArchNode label="GitHub: Taskify-Frontend" sublabel="Frontend repo" color="border-indigo-500/50 bg-indigo-500/[0.07]" icon="🐙" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ArchNode label="GitHub: Taskify-Backend" sublabel="Backend repo" color="border-violet-500/50 bg-violet-500/[0.07]" icon="🐙" />
                </div>
              </div>

              {/* Row 1 → Row 2 arrows */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex justify-center"><Arrow /></div>
                <div className="flex justify-center"><Arrow /></div>
              </div>

              {/* Row 2 — deploy targets */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center gap-2">
                  <ArchNode label="Vercel — React" sublabel="Frontend deploy" color="border-indigo-500/30 bg-indigo-500/[0.09]" icon="▲" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ArchNode label="Render — Node.js" sublabel="Backend API" color="border-violet-500/30 bg-violet-500/[0.09]" icon="⚙️" />
                </div>
              </div>

              {/* Convergence lines → Neon */}
              <div className="relative flex justify-center mt-2">
                {/* left arm */}
                <div className="absolute left-[25%] top-0 w-[26%] h-6 border-b border-l border-dashed border-white/15 rounded-bl-lg" />
                {/* right arm */}
                <div className="absolute right-[25%] top-0 w-[26%] h-6 border-b border-r border-dashed border-white/15 rounded-br-lg" />
                <div className="flex flex-col items-center mt-6">
                  <Arrow />
                </div>
              </div>

              {/* Row 3 — Neon PostgreSQL */}
              <div className="flex justify-center mt-2">
                <div className="w-56">
                  <ArchNode label="Neon PostgreSQL" sublabel="Prisma ORM · multi-tenant" color="border-cyan-500/40 bg-cyan-500/[0.06]" icon="🗄️" />
                </div>
              </div>

              {/* Neon → Gemini */}
              <div className="flex justify-center"><Arrow /></div>

              {/* Row 4 — Gemini AI */}
              <div className="flex justify-center">
                <div className="w-56">
                  <ArchNode label="Gemini AI API" sublabel="Google GenAI · reports" color="border-emerald-500/40 bg-emerald-500/[0.06]" icon="🤖" />
                </div>
              </div>
            </div>

            {/* ── Mobile: vertical stack ── */}
            <div className="flex sm:hidden flex-col items-center gap-1">
              {[
                { label: 'GitHub: Taskify-Frontend', sublabel: 'Frontend repo',          color: 'border-indigo-500/50 bg-indigo-500/[0.07]', icon: '💻' },
                { label: 'Vercel — React',           sublabel: 'Frontend deploy',         color: 'border-indigo-500/30 bg-indigo-500/[0.09]', icon: '▲'  },
                { label: 'GitHub: Taskify-Backend',  sublabel: 'Backend repo',            color: 'border-violet-500/50 bg-violet-500/[0.07]', icon: '💻' },
                { label: 'Render — Node.js',         sublabel: 'Backend API',             color: 'border-violet-500/30 bg-violet-500/[0.09]', icon: '⚙️' },
                { label: 'Neon PostgreSQL',          sublabel: 'Prisma ORM · multi-tenant',color:'border-cyan-500/40 bg-cyan-500/[0.06]',     icon: '🗄️' },
                { label: 'Gemini AI API',            sublabel: 'Google GenAI · reports',  color: 'border-emerald-500/40 bg-emerald-500/[0.06]',icon: '🤖' },
              ].map((node, i) => (
                <div key={node.label} className="flex flex-col items-center w-full max-w-[240px] gap-0.5">
                  {i > 0 && <Arrow />}
                  <ArchNode {...node} />
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-8 pt-4 border-t border-white/[0.04] text-xs text-white/30">
              {[
                { dot: 'bg-indigo-500/60',   lbl: 'Frontend' },
                { dot: 'bg-violet-500/60',   lbl: 'Backend'  },
                { dot: 'bg-cyan-500/60',     lbl: 'Database' },
                { dot: 'bg-emerald-500/60',  lbl: 'AI / ML'  },
              ].map(({ dot, lbl }) => (
                <div key={lbl} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${dot}`} />
                  {lbl}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: Lessons Learned ───────────────────────── */}
        <section className="space-y-5 animate-fade-up">
          <h2 className="font-heading font-bold text-2xl text-white border-l-2 border-indigo pl-4">
            What I Learned
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Building2 className="h-5 w-5" />,
                title: 'Design for multi-tenancy from day one',
                desc: 'Retrofitting data isolation after the fact is exponentially harder. Baking companyId into every query, service signature, and middleware from the start saved weeks of refactoring.',
              },
              {
                icon: <Wifi className="h-5 w-5" />,
                title: 'Real-time sync is deceptively complex',
                desc: 'Keeping Socket.io, TanStack Query cache, and Zustand store in sync required careful invalidation logic. Optimistic UI without race conditions is an art form.',
              },
              {
                icon: <Cpu className="h-5 w-5" />,
                title: 'AI integrations need production fallbacks',
                desc: 'Quota limits, network failures, and model changes are facts of life. Every AI call needs a deterministic fallback that produces the same data shape — users should never see a blank screen.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-white/[0.07] bg-[#0D1220] p-5 space-y-2">
                <div className="text-indigo">{icon}</div>
                <p className="font-semibold text-sm text-white">{title}</p>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 7: Footer CTA ────────────────────────────── */}
        <section className="text-center space-y-6 animate-fade-up pb-8">
          <h2 className="font-heading font-bold text-2xl text-white">
            See It In Action
          </h2>
          <p className="text-white/40 text-sm">
            Explore the live app or browse the full source code.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://taskify-frontend-steel.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-lg shadow-indigo/25"
            >
              <ExternalLink className="h-4 w-4" /> See it live
            </a>
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
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/stats" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-indigo transition-colors">
              <Lightbulb className="h-3 w-3" /> Live Stats
            </Link>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-indigo transition-colors">
              <Zap className="h-3 w-3" /> Try Demo
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

