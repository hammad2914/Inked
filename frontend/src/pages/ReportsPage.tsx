import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import {
  BarChart3, Loader2, Download, Sparkles, FileText, AlertCircle,
  CheckCircle2, Clock, AlertTriangle, Users, TrendingUp, ChevronDown, ChevronUp,
  FolderKanban, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Project, ApiResponse } from '@/types';

// ── Types matching new backend ReportData ────────────────────────────────────

interface TaskDetail {
  title: string;
  status: string;
  priority: string;
  assignee: string;
  deadline: string;
  completedAt?: string;
  daysOverdue?: number;
  daysRemaining?: number;
}

interface MemberPerformance {
  name: string;
  assigned: number;
  completed: number;
  overdue: number;
  inProgress: number;
  completionRate: number;
}

interface ProjectSection {
  projectName: string;
  projectStatus: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  memberCount: number;
  performanceScore: number;
  overdueTasks_list: TaskDetail[];
  topRisk: string;
}

interface BackendReportData {
  summary: string;
  performanceScore: number;
  keyMetrics: { label: string; value: string }[];
  risks: { level: 'HIGH' | 'MEDIUM' | 'LOW'; description: string; affectedTasks?: string[] }[];
  recommendations: string[];
  taskHighlights: {
    overdueTasks: TaskDetail[];
    recentlyCompleted: TaskDetail[];
    atRiskTasks: TaskDetail[];
  };
  memberPerformance: MemberPerformance[];
  projectBreakdown?: ProjectSection[] | null;
  velocityInsight: string;
}

interface Report {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  data: BackendReportData;
  project?: { name: string };
  createdBy: { fullName: string };
  aiGenerated?: boolean;
}

// ── Colour helpers ────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  HIGH:   'bg-danger/10 text-danger border border-danger/20',
  MEDIUM: 'bg-warning/10 text-warning border border-warning/20',
  LOW:    'bg-indigo/10 text-indigo border border-indigo/20',
};
const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-400',
  MEDIUM:   'bg-amber-400',
  LOW:      'bg-blue-400',
};
function scoreColor(s: number) {
  return s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TaskRow({ task, variant }: { task: TaskDetail; variant: 'overdue' | 'done' | 'risk' }) {
  const accentMap = {
    overdue: 'border-l-danger/60',
    done:    'border-l-success/50',
    risk:    'border-l-warning/60',
  };
  return (
    <div className={cn('flex items-start gap-3 rounded-xl px-3 py-2.5 bg-white/[0.025] border border-white/[0.06] border-l-2', accentMap[variant])}>
      <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-white/30')} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 leading-snug truncate">{task.title}</p>
        <p className="text-xs text-white/35 mt-0.5">
          {task.assignee}
          {variant === 'overdue' && task.daysOverdue !== undefined && (
            <span className="text-danger/70 ml-2">{task.daysOverdue}d overdue</span>
          )}
          {variant === 'done' && task.completedAt && (
            <span className="text-success/60 ml-2">✓ {task.completedAt}</span>
          )}
          {variant === 'risk' && task.daysRemaining !== undefined && (
            <span className="text-warning/70 ml-2">{task.daysRemaining}d left</span>
          )}
        </p>
      </div>
      <span className={cn('text-[10px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0',
        task.priority === 'CRITICAL' ? 'bg-red-500/15 text-red-400' :
        task.priority === 'HIGH'     ? 'bg-orange-400/15 text-orange-400' :
        'bg-white/[0.05] text-white/35')}>
        {task.priority}
      </span>
    </div>
  );
}

function MemberTable({ members }: { members: MemberPerformance[] }) {
  const sorted = [...members].sort((a, b) => b.completionRate - a.completionRate);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Member', 'Assigned', 'Completed', 'In Progress', 'Overdue', 'Rate'].map((h) => (
              <th key={h} className="text-[10px] font-bold uppercase tracking-wider text-white/30 pb-2.5 text-left px-2 first:px-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {sorted.map((m) => (
            <tr key={m.name} className="hover:bg-white/[0.02] transition-colors">
              <td className="py-2.5 px-0">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500/60 to-violet-500/60 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <span className="text-sm text-white/70 font-medium">{m.name}</span>
                </div>
              </td>
              <td className="py-2.5 px-2 text-white/50 font-mono text-xs">{m.assigned}</td>
              <td className="py-2.5 px-2 text-success/70 font-mono text-xs">{m.completed}</td>
              <td className="py-2.5 px-2 text-indigo/70 font-mono text-xs">{m.inProgress}</td>
              <td className="py-2.5 px-2">
                <span className={cn('font-mono text-xs', m.overdue > 0 ? 'text-danger/70' : 'text-white/30')}>
                  {m.overdue}
                </span>
              </td>
              <td className="py-2.5 px-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] min-w-[48px]">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${m.completionRate}%`, background: scoreColor(m.completionRate) }} />
                  </div>
                  <span className="text-xs font-mono" style={{ color: scoreColor(m.completionRate) }}>
                    {m.completionRate}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectCard({ proj }: { proj: ProjectSection }) {
  const [open, setOpen] = useState(false);
  const sc = scoreColor(proj.performanceScore);
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-indigo/15 flex items-center justify-center shrink-0">
            <FolderKanban className="h-4 w-4 text-indigo" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-white/80 truncate">{proj.projectName}</p>
            <p className="text-xs text-white/35 mt-0.5">
              {proj.completedTasks}/{proj.totalTasks} tasks · {proj.memberCount} members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="text-right">
            <div className="text-sm font-bold font-mono" style={{ color: sc }}>{proj.performanceScore}/100</div>
            <div className="text-[10px] text-white/30">{proj.completionRate}% done</div>
          </div>
          {/* Mini progress ring */}
          <div className="relative h-8 w-8">
            <svg className="rotate-[-90deg]" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
              <circle cx="16" cy="16" r="13" fill="none" stroke={sc} strokeWidth="3"
                strokeDasharray={`${(proj.completionRate / 100) * 81.7} 81.7`}
                strokeLinecap="round" />
            </svg>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-3 border-t border-white/[0.05] pt-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Done',        value: proj.completedTasks,  color: 'text-success/70' },
              { label: 'In Progress', value: proj.inProgressTasks, color: 'text-indigo/70' },
              { label: 'Overdue',     value: proj.overdueTasks,    color: proj.overdueTasks > 0 ? 'text-danger/70' : 'text-white/30' },
              { label: 'Total',       value: proj.totalTasks,      color: 'text-white/50' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-white/[0.03] py-2.5 px-1 border border-white/[0.05]">
                <div className={cn('font-mono font-bold text-lg', color)}>{value}</div>
                <div className="text-[10px] text-white/30">{label}</div>
              </div>
            ))}
          </div>
          {proj.overdueTasks_list.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-danger/50">Overdue Tasks</p>
              {proj.overdueTasks_list.map((t) => <TaskRow key={t.title} task={t} variant="overdue" />)}
            </div>
          )}
          <div className="flex items-start gap-2 rounded-xl bg-warning/[0.05] border border-warning/15 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning/60 shrink-0 mt-0.5" />
            <p className="text-xs text-white/45 leading-relaxed">{proj.topRisk}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [reportType, setReportType] = useState('PROJECT_SUMMARY');
  const { toast } = useToast();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<ApiResponse<Project[]>>('/projects').then((r) => r.data.data),
  });

  const { data: reports = [], isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['reports', selectedProject],
    queryFn: () =>
      api.get<ApiResponse<Report[]>>('/reports', {
        params: selectedProject !== 'all' ? { projectId: selectedProject } : undefined,
      }).then((r) => r.data.data),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<ApiResponse<{ report: Report; data: BackendReportData }>>('/reports/generate', {
        type: reportType,
        title: `${reportType.replace(/_/g, ' ')} — ${format(new Date(), 'MMM d, yyyy')}`,
        projectId: selectedProject !== 'all' ? selectedProject : undefined,
      }),
    onSuccess: () => {
      void refetchReports();
      toast({ title: '✅ Report generated!', description: 'Your AI report is ready.' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Generation failed', description: e.response?.data?.message ?? 'Could not generate report' });
    },
  });

  const downloadReport = async (reportId: string) => {
    try {
      const res = await api.get(`/reports/${reportId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: 'Download failed' });
    }
  };

  const latestReport = reports[0];
  const rd = latestReport?.data;
  const sc = rd ? scoreColor(rd.performanceScore) : '#6366F1';

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">AI Reports</h1>
          <p className="text-sm text-white/35 mt-1">Deep project insights with task-level detail</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-44 h-10 bg-surface border-white/[0.08] text-white/70 rounded-xl">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="glass-elevated border-white/[0.08] rounded-xl">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48 h-10 bg-surface border-white/[0.08] text-white/70 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-elevated border-white/[0.08] rounded-xl">
              <SelectItem value="PROJECT_SUMMARY">Project Summary</SelectItem>
              <SelectItem value="TIMELINE_ANALYSIS">Timeline Analysis</SelectItem>
              <SelectItem value="RISK_DETECTION">Risk Detection</SelectItem>
              <SelectItem value="USER_PERFORMANCE">User Performance</SelectItem>
              <SelectItem value="PRODUCTIVITY_INSIGHTS">Productivity Insights</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-gradient-primary text-white rounded-xl h-10 px-4 shimmer shadow-glow-sm hover:shadow-glow transition-all gap-2"
          >
            {generateMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              : <><Sparkles className="h-4 w-4" /> Generate Report</>}
          </Button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!reportsLoading && reports.length === 0 && (
        <div className="glass rounded-2xl p-16 flex flex-col items-center text-center animate-fade-up">
          <BarChart3 className="h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/40 font-heading font-semibold text-lg">No reports generated yet</p>
          <p className="text-white/25 text-sm mt-2 max-w-sm">Select a project and report type above, then click Generate Report to get AI-powered insights with task-level detail.</p>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {reportsLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl skeleton" />)}
          </div>
          <Skeleton className="h-48 rounded-2xl skeleton" />
        </div>
      )}

      {rd && (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger animate-fade-up" style={{ animationDelay: '60ms' }}>
            {[
              { label: 'Performance Score', value: `${rd.performanceScore}/100`, color: sc,        icon: <TrendingUp className="h-4 w-4" /> },
              { label: 'Overdue Tasks',     value: rd.taskHighlights?.overdueTasks?.length ?? rd.risks?.filter(r => r.level === 'HIGH').length ?? 0, color: '#EF4444', icon: <AlertTriangle className="h-4 w-4" /> },
              { label: 'Members Tracked',  value: rd.memberPerformance?.length ?? 0,              color: '#6366F1', icon: <Users className="h-4 w-4" /> },
              { label: 'Recommendations',  value: rd.recommendations?.length ?? 0,                color: '#10B981', icon: <Zap className="h-4 w-4" /> },
            ].map(({ label, value, color, icon }, i) => (
              <div key={label} className="glass rounded-2xl p-5 card-hover animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, color }}>
                    {icon}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{label}</p>
                </div>
                <p className="font-heading font-bold text-3xl" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Summary + Score gauge ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {/* Summary */}
            <div className="glass rounded-2xl p-5 lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet" />
                <h2 className="font-heading font-semibold text-sm text-white">AI Executive Summary</h2>
                {latestReport?.aiGenerated && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet/15 text-violet border border-violet/25">AI Generated</span>
                )}
              </div>
              <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{rd.summary}</div>
              {rd.velocityInsight && (
                <div className="flex items-start gap-2 rounded-xl bg-indigo/[0.07] border border-indigo/20 px-3 py-2.5 mt-1">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo/80 italic">{rd.velocityInsight}</p>
                </div>
              )}
            </div>

            {/* Score gauge */}
            <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center text-center">
              <h2 className="font-heading font-semibold text-sm text-white mb-3">Performance Score</h2>
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="68%" outerRadius="88%"
                    startAngle={210} endAngle={-30}
                    data={[{ value: rd.performanceScore, fill: sc }]}
                    barSize={12}
                  >
                    <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, color: 'hsl(var(--foreground))', fontSize: 12 }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading font-bold text-3xl" style={{ color: sc }}>{rd.performanceScore}</span>
                  <span className="text-[11px] text-white/35">/ 100</span>
                </div>
              </div>
              {/* Key metrics list */}
              <div className="w-full mt-3 divide-y divide-white/[0.05]">
                {rd.keyMetrics?.slice(0, 4).map((m) => (
                  <div key={m.label} className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-white/35">{m.label}</span>
                    <span className="text-xs font-semibold text-white/70 font-mono">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Task Highlights ── */}
          {rd.taskHighlights && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '140ms' }}>
              {/* Overdue */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                  <h2 className="font-heading font-semibold text-sm text-white">Overdue Tasks</h2>
                  <span className="ml-auto text-xs font-mono text-danger/70">{rd.taskHighlights.overdueTasks?.length ?? 0}</span>
                </div>
                {rd.taskHighlights.overdueTasks?.length > 0 ? (
                  <div className="space-y-2">
                    {rd.taskHighlights.overdueTasks.map((t) => (
                      <TaskRow key={t.title} task={t} variant="overdue" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/25 text-center py-4">No overdue tasks 🎉</p>
                )}
              </div>

              {/* At-risk */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <h2 className="font-heading font-semibold text-sm text-white">At-Risk (≤5 days)</h2>
                  <span className="ml-auto text-xs font-mono text-warning/70">{rd.taskHighlights.atRiskTasks?.length ?? 0}</span>
                </div>
                {rd.taskHighlights.atRiskTasks?.length > 0 ? (
                  <div className="space-y-2">
                    {rd.taskHighlights.atRiskTasks.map((t) => (
                      <TaskRow key={t.title} task={t} variant="risk" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/25 text-center py-4">No tasks at risk</p>
                )}
              </div>

              {/* Recently completed */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <h2 className="font-heading font-semibold text-sm text-white">Recently Completed</h2>
                  <span className="ml-auto text-xs font-mono text-success/70">{rd.taskHighlights.recentlyCompleted?.length ?? 0}</span>
                </div>
                {rd.taskHighlights.recentlyCompleted?.length > 0 ? (
                  <div className="space-y-2">
                    {rd.taskHighlights.recentlyCompleted.map((t) => (
                      <TaskRow key={t.title} task={t} variant="done" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/25 text-center py-4">No recent completions</p>
                )}
              </div>
            </div>
          )}

          {/* ── Member Performance ── */}
          {rd.memberPerformance?.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo" />
                <h2 className="font-heading font-semibold text-sm text-white">Member Performance</h2>
                <span className="ml-auto text-xs text-white/25">{rd.memberPerformance.length} members</span>
              </div>
              <MemberTable members={rd.memberPerformance} />
            </div>
          )}

          {/* ── Risks ── */}
          {rd.risks?.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <h2 className="font-heading font-semibold text-sm text-white">Risk Assessment</h2>
              </div>
              <div className="space-y-2.5">
                {rd.risks.map((r, i) => (
                  <div key={i} className={cn('rounded-xl px-4 py-3 space-y-1', RISK_COLORS[r.level] ?? RISK_COLORS['LOW'])}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider border border-current/30 rounded px-1.5 py-0.5">{r.level}</span>
                      <p className="text-sm leading-relaxed">{r.description}</p>
                    </div>
                    {r.affectedTasks && r.affectedTasks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-8">
                        {r.affectedTasks.map((t) => (
                          <span key={t} className="text-[10px] font-mono bg-black/20 rounded px-2 py-0.5 opacity-80">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Per-project breakdown (company-wide only) ── */}
          {rd.projectBreakdown && rd.projectBreakdown.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-3 animate-fade-up" style={{ animationDelay: '220ms' }}>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-cyan" />
                <h2 className="font-heading font-semibold text-sm text-white">Per-Project Breakdown</h2>
                <span className="ml-auto text-xs text-white/25">{rd.projectBreakdown.length} projects</span>
              </div>
              <div className="space-y-2">
                {rd.projectBreakdown.map((proj) => (
                  <ProjectCard key={proj.projectName} proj={proj} />
                ))}
              </div>
            </div>
          )}

          {/* ── Recommendations ── */}
          {rd.recommendations?.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
              <h2 className="font-heading font-semibold text-sm text-white">Action Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rd.recommendations.map((rec, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="h-6 w-6 rounded-full bg-indigo/20 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-indigo">
                      {i + 1}
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Report history ── */}
      <div className="glass rounded-2xl p-5 space-y-3 animate-fade-up" style={{ animationDelay: '280ms' }}>
        <h2 className="font-heading font-semibold text-sm text-white flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo" /> Report History
        </h2>
        {reportsLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl skeleton" />)}</div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <BarChart3 className="h-8 w-8 text-white/10 mb-2" />
            <p className="text-sm text-white/30">No reports yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {reports.map((report, i) => {
              const s = report.data?.performanceScore ?? 0;
              const c = scoreColor(s);
              return (
                <div key={report.id}
                  className="flex items-center gap-3 rounded-xl p-3 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all group animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/75 truncate">{report.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-white/30 font-mono">{format(new Date(report.createdAt), 'MMM d, h:mm a')}</span>
                      {report.project?.name && <span className="text-[11px] text-indigo/60">{report.project.name}</span>}
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: `${c}20`, color: c, border: `1px solid ${c}30` }}>
                        {s}/100
                      </span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost"
                    onClick={() => void downloadReport(report.id)}
                    className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/[0.08] rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
