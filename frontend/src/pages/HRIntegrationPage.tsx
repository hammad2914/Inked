import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2, Plug, Settings2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { ApiResponse } from '@/types';

interface HRStatus { configured: boolean; apiUrl: string | null; lastSync: string | null; status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' }
interface SyncLog { id: string; status: 'SUCCESS' | 'ERROR'; recordsSynced: number; errorMessage: string | null; createdAt: string }

const TOOLS = [
  { name: 'BambooHR',    desc: 'HR management for small and medium businesses', color: '#75BC22', initial: 'B' },
  { name: 'Workday',     desc: 'Enterprise cloud-based financial management',   color: '#F05B1E', initial: 'W' },
  { name: 'ADP',         desc: 'Payroll, HR, talent and benefits solutions',    color: '#D0021B', initial: 'A' },
  { name: 'Custom API',  desc: 'Connect any HR system via REST API',           color: '#6366F1', initial: 'C' },
];

export function HRIntegrationPage() {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: hrStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['hr', 'status'],
    queryFn: () => api.get<ApiResponse<HRStatus>>('/hr/status').then((r) => r.data.data),
  });

  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['hr', 'logs'],
    queryFn: () => api.get<ApiResponse<SyncLog[]>>('/hr/logs').then((r) => r.data.data).catch(() => [] as SyncLog[]),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/hr/test', { apiUrl, apiKey }),
    onSuccess: () => setTestResult({ success: true, message: 'Connection successful! API is reachable.' }),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setTestResult({ success: false, message: e.response?.data?.message ?? 'Connection failed' });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => api.post('/hr/configure', { apiUrl, apiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr'] });
      toast({ title: '✅ HR integration configured!' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Configuration failed' }),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post('/hr/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr'] });
      toast({ title: '✅ Sync completed successfully!' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Sync failed' }),
  });

  const isConnected = hrStatus?.status === 'CONNECTED';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">HR Integration</h1>
          <p className="text-sm text-white/35 mt-1">Connect your HR system to sync employee data</p>
        </div>
        <div className={cn(
          'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold border',
          isConnected
            ? 'bg-success/15 text-success border-success/25 glow-success'
            : 'bg-white/[0.05] text-white/40 border-white/[0.08]',
        )}>
          <div className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-success animate-pulse-glow' : 'bg-white/20')} />
          {statusLoading ? '…' : isConnected ? 'Connected' : 'Not Connected'}
        </div>
      </div>

      <Tabs defaultValue="connect" className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <TabsList className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 h-10 gap-1">
          {[
            { value: 'connect', label: 'Connect', icon: Plug },
            { value: 'mapping', label: 'Field Mapping', icon: Settings2 },
            { value: 'logs',    label: 'Sync Logs', icon: Database },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}
              className="rounded-lg text-xs font-semibold text-white/40 data-[state=active]:bg-indigo/20 data-[state=active]:text-indigo data-[state=active]:shadow-none transition-all flex items-center gap-1.5 px-4">
              <Icon className="h-3.5 w-3.5" /> {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Connect tab */}
        <TabsContent value="connect" className="mt-5 space-y-5">
          {/* Tool cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            {TOOLS.map((tool, i) => (
              <div key={tool.name}
                className={cn(
                  'glass rounded-2xl p-4 space-y-3 card-hover cursor-pointer animate-fade-in border transition-all',
                  i === 3
                    ? 'border-indigo/25 bg-indigo/[0.04]'
                    : 'border-white/[0.06] hover:border-white/[0.12]',
                )}
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-heading font-bold text-white"
                    style={{ background: `${tool.color}25`, border: `1px solid ${tool.color}30` }}>
                    {tool.initial}
                  </div>
                  {i === 3 && (
                    <span className="text-[10px] font-bold text-indigo bg-indigo/15 border border-indigo/25 rounded-full px-2 py-0.5">Active</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-white/85">{tool.name}</p>
                  <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{tool.desc}</p>
                </div>
                <Button size="sm"
                  className={cn(
                    'w-full rounded-lg h-8 text-xs',
                    i === 3
                      ? 'bg-gradient-primary text-white shimmer shadow-glow-sm'
                      : 'bg-white/[0.05] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]',
                  )}>
                  {i === 3 ? 'Configure' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>

          {/* API Config form */}
          <div className="glass rounded-2xl p-5 space-y-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <h2 className="font-heading font-semibold text-sm text-white flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo" /> API Configuration
            </h2>
            <Separator className="bg-white/[0.06]" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">API Endpoint URL</Label>
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.yourhr.com/v1"
                  className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">API Key</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-••••••••••••••••"
                  className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg font-mono text-sm"
                />
              </div>
            </div>

            {testResult && (
              <div className={cn(
                'flex items-start gap-2.5 rounded-xl p-3 text-sm',
                testResult.success ? 'bg-success/10 border border-success/20 text-success' : 'bg-danger/10 border border-danger/20 text-danger',
              )}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                {testResult.message}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => { setTestResult(null); testMutation.mutate(); }}
                disabled={!apiUrl || testMutation.isPending}
                variant="outline"
                className="border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2"
              >
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
                Test Connection
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!apiUrl || !apiKey || saveMutation.isPending}
                className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm gap-2"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                Save & Connect
              </Button>
              {isConnected && (
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  variant="outline"
                  className="border-success/30 text-success hover:bg-success/10 rounded-xl gap-2"
                >
                  {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Sync Now
                </Button>
              )}
            </div>

            {hrStatus?.lastSync && (
              <p className="text-xs text-white/30">
                Last synced: <span className="font-mono text-white/50">{format(new Date(hrStatus.lastSync), 'MMM d, yyyy h:mm a')}</span>
              </p>
            )}
          </div>
        </TabsContent>

        {/* Field mapping tab */}
        <TabsContent value="mapping" className="mt-5">
          <div className="glass rounded-2xl p-5 animate-scale-in">
            <h2 className="font-heading font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-indigo" /> Field Mapping
            </h2>
            <div className="overflow-x-auto"><div className="min-w-[360px] grid grid-cols-[1fr_40px_1fr] gap-3 items-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-1">HR System Field</div>
              <div />
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-1">Taskify Field</div>
              {[
                ['employee_id', 'id'],
                ['first_name + last_name', 'fullName'],
                ['work_email', 'email'],
                ['department_name', 'department'],
                ['job_title', 'designation'],
              ].map(([hr, taskify], i) => (
                <>
                  <div key={`hr-${i}`} className="rounded-lg bg-white/[0.04] border border-white/[0.07] px-3 py-2 text-sm font-mono text-white/60">{hr}</div>
                  <div key={`arrow-${i}`} className="text-center text-white/20 font-mono text-sm">→</div>
                  <div key={`t-${i}`} className="rounded-lg bg-indigo/[0.08] border border-indigo/15 px-3 py-2 text-sm font-mono text-indigo/80">{taskify}</div>
                </>
              ))}
            </div></div>
          </div>
        </TabsContent>

        {/* Sync logs tab */}
        <TabsContent value="logs" className="mt-5">
          <div className="glass rounded-2xl overflow-hidden animate-scale-in">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h2 className="font-heading font-semibold text-sm text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo" /> Sync History
              </h2>
            </div>
            {logsLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl skeleton" />)}
              </div>
            ) : syncLogs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Database className="h-10 w-10 text-white/10 mb-3" />
                <p className="font-heading font-semibold text-white/35">No sync history yet</p>
                <p className="text-sm text-white/20 mt-1">Run a sync to see logs here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <div className="min-w-[480px] divide-y divide-border stagger">
                {syncLogs.map((log, i) => (
                  <div key={log.id}
                    className={cn(
                      'flex items-center gap-4 px-5 py-3.5 animate-fade-in',
                      log.status === 'ERROR' && 'bg-danger/[0.03]',
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}>
                    {log.status === 'SUCCESS'
                      ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      : <XCircle className="h-4 w-4 text-danger shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold', log.status === 'SUCCESS' ? 'text-foreground/75' : 'text-danger/80')}>
                        {log.status === 'SUCCESS' ? `${log.recordsSynced} records synced` : 'Sync failed'}
                      </p>
                      {log.errorMessage && (
                        <p className="text-xs text-danger/60 mt-0.5 truncate">{log.errorMessage}</p>
                      )}
                    </div>
                    <span className="text-xs text-foreground/25 font-mono shrink-0">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                ))}
              </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
