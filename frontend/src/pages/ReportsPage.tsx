import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { Project, ApiResponse } from '@/types';
import './landing.css';

// ── Types matching the backend's ReportData ──────────────────────────────────

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
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  performanceScore: number;
  topRisk: string;
}

interface BackendReportData {
  summary: string;
  performanceScore: number;
  keyMetrics: { label: string; value: string }[];
  risks: { level: 'HIGH' | 'MEDIUM' | 'LOW'; description: string; affectedTasks?: string[] }[];
  recommendations: string[];
  taskHighlights?: {
    overdueTasks: TaskDetail[];
    recentlyCompleted: TaskDetail[];
    atRiskTasks: TaskDetail[];
  };
  memberPerformance?: MemberPerformance[];
  projectBreakdown?: ProjectSection[] | null;
  velocityInsight?: string;
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

const TYPES: Record<string, string> = {
  PROJECT_SUMMARY: 'Project summary',
  TIMELINE_ANALYSIS: 'Timeline check',
  RISK_DETECTION: 'Risk report',
  USER_PERFORMANCE: 'People report',
  PRODUCTIVITY_INSIGHTS: 'Pace report',
};

function MemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h3>{title}</h3>
      {children}
    </>
  );
}

function Memo({ report, company }: { report: Report; company: string }) {
  const rd = report.data;
  const h = rd.taskHighlights;
  return (
    <div className="wall-memo" style={{ transform: 'none' }}>
      <div className="clip" />
      <div className="score">{rd.performanceScore}</div>
      <div className="hd">
        <span>TO</span>{company}, project leads
        <span>RE</span>{TYPES[report.type] ?? report.type} · {report.project?.name ?? 'all projects'}
        <span>DATE</span>{format(new Date(report.createdAt), 'EEE d MMM yyyy, HH:mm')}
        <span>FROM</span>{report.aiGenerated ? 'Gemini, for ' : 'The template, for '}{report.createdBy.fullName}
      </div>

      <MemoSection title="Summary">
        <p className="whitespace-pre-line">{rd.summary}</p>
        {rd.velocityInsight && <p className="mt-2">{rd.velocityInsight}</p>}
      </MemoSection>

      {rd.keyMetrics?.length > 0 && (
        <MemoSection title="Numbers">
          <table><tbody>
            {rd.keyMetrics.map((m) => <tr key={m.label}><td>{m.label}</td><td>{m.value}</td></tr>)}
          </tbody></table>
        </MemoSection>
      )}

      {h && (h.overdueTasks?.length > 0 || h.atRiskTasks?.length > 0 || h.recentlyCompleted?.length > 0) && (
        <MemoSection title="Tasks to look at">
          <table><tbody>
            {h.overdueTasks?.map((t) => <tr key={`o-${t.title}`}><td>{t.title} · {t.assignee}</td><td className="late">{t.daysOverdue ?? '?'} days overdue</td></tr>)}
            {h.atRiskTasks?.map((t) => <tr key={`r-${t.title}`}><td>{t.title} · {t.assignee}</td><td>{t.daysRemaining ?? '?'} days left</td></tr>)}
            {h.recentlyCompleted?.map((t) => <tr key={`c-${t.title}`}><td>{t.title} · {t.assignee}</td><td>done{t.completedAt ? ` ${t.completedAt}` : ''}</td></tr>)}
          </tbody></table>
        </MemoSection>
      )}

      {rd.risks?.length > 0 && (
        <MemoSection title="Risks">
          <table><tbody>
            {rd.risks.map((r, i) => (
              <tr key={i}><td>{r.description}</td><td className={r.level === 'HIGH' ? 'late' : ''}>{r.level.toLowerCase()}</td></tr>
            ))}
          </tbody></table>
        </MemoSection>
      )}

      {rd.memberPerformance && rd.memberPerformance.length > 0 && (
        <MemoSection title="People">
          <table><tbody>
            {[...rd.memberPerformance].sort((a, b) => b.completionRate - a.completionRate).map((m) => (
              <tr key={m.name}>
                <td>{m.name} · {m.completed} of {m.assigned} done{m.overdue > 0 && <span className="late">, {m.overdue} late</span>}</td>
                <td>{m.completionRate}%</td>
              </tr>
            ))}
          </tbody></table>
        </MemoSection>
      )}

      {rd.projectBreakdown && rd.projectBreakdown.length > 0 && (
        <MemoSection title="By project">
          <table><tbody>
            {rd.projectBreakdown.map((p) => (
              <tr key={p.projectName}>
                <td>{p.projectName} · {p.completedTasks} of {p.totalTasks} done{p.overdueTasks > 0 && <span className="late">, {p.overdueTasks} late</span>}<br /><span className="text-[12px] text-muted-foreground">{p.topRisk}</span></td>
                <td>{p.performanceScore}/100</td>
              </tr>
            ))}
          </tbody></table>
        </MemoSection>
      )}

      {rd.recommendations?.length > 0 && (
        <MemoSection title="What to do this week">
          <ol className="list-decimal pl-5">
            {rd.recommendations.map((r, i) => <li key={i} className="mb-1">{r}</li>)}
          </ol>
        </MemoSection>
      )}

      <div className="scrib">{report.aiGenerated ? 'written by Gemini' : 'filled in from the template'}</div>
    </div>
  );
}

export function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [reportType, setReportType] = useState('PROJECT_SUMMARY');
  const [openId, setOpenId] = useState<string | null>(null);
  const { toast } = useToast();
  const { company } = useAuthStore();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<ApiResponse<Project[]>>('/projects').then((r) => r.data.data),
  });

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['reports', selectedProject],
    queryFn: () =>
      api.get<ApiResponse<Report[]>>('/reports', {
        params: selectedProject !== 'all' ? { projectId: selectedProject } : undefined,
      }).then((r) => r.data.data),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<ApiResponse<{ report: Report }>>('/reports/generate', {
        type: reportType,
        title: `${TYPES[reportType]}, ${format(new Date(), 'd MMM yyyy')}`,
        projectId: selectedProject !== 'all' ? selectedProject : undefined,
      }),
    onSuccess: () => {
      setOpenId(null);
      void refetch();
      toast({ title: 'The memo is ready' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'The memo could not be written', description: e.response?.data?.message ?? 'Try again.' });
    },
  });

  const downloadReport = async (reportId: string) => {
    try {
      const res = await api.get(`/reports/${reportId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `inked-report-${reportId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: 'The PDF could not be downloaded' });
    }
  };

  const open = reports.find((r) => r.id === openId) ?? reports[0];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="sheet px-4 pb-5 pt-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-print pb-2">
          <h1 className="print-head text-[clamp(36px,5vw,60px)]">Reports</h1>
          <p className="max-w-md text-right text-sm text-muted-foreground">Gemini reads a project and writes the memo. If it can't, a plain template fills the same sections.</p>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <span className="field-label">About</span>
            <Select value={selectedProject} onValueChange={(v) => { setSelectedProject(v); setOpenId(null); }}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <span className="field-label">Kind of memo</span>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPES).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="btn-ink h-11 px-5">
            {generateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing it…</> : 'Write the memo'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="skeleton h-96 w-full" />
      ) : reports.length === 0 ? (
        <div className="sheet py-16 text-center">
          <p className="hand text-[26px] text-graphite">no memos yet. choose a project and write the first one</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="pt-4">{open && <Memo report={open} company={company?.name ?? 'The company'} />}</div>
          <div className="sheet h-max px-4 py-4">
            <h2 className="print-head border-b-2 border-print pb-1 text-[22px]">On file · {reports.length}</h2>
            <ul className="max-h-[560px] divide-y divide-rule overflow-y-auto">
              {reports.map((r) => (
                <li key={r.id} className={cn('flex items-start gap-2 py-2.5', r.id === open?.id && 'bg-pen/[0.05]')}>
                  <button onClick={() => setOpenId(r.id)} className="min-w-0 flex-1 px-1 text-left">
                    <p className={cn('truncate text-sm', r.id === open?.id ? 'font-semibold text-pen' : 'font-medium')}>{TYPES[r.type] ?? r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.project?.name ?? 'All projects'} · <span className="font-mono">{format(new Date(r.createdAt), 'd MMM, HH:mm')}</span></p>
                  </button>
                  <button onClick={() => void downloadReport(r.id)} aria-label="Download as PDF" title="Download as PDF"
                    className="rounded-[3px] p-1.5 text-muted-foreground hover:bg-print/[0.06] hover:text-print">
                    <Download className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
