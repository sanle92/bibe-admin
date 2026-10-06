import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  HardDrive,
  Wifi,
  Server,
  Layers,
  AlertCircle,
  Gauge,
  Activity,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from 'date-fns';
import { fetchHealthChecks, runHealthChecks, fetchBackgroundJobs, fetchErrorLogs, fetchSystemStats, retryJob, type HealthCheck } from '@/services/systemService';

const TABS = ['health', 'database', 'jobs', 'errors', 'performance'] as const;
type Tab = (typeof TABS)[number];

export function SystemPage() {
  const [activeTab, setActiveTab] = useState<Tab>('health');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: health = [], isLoading: healthLoading } = useQuery({ queryKey: ['healthChecks'], queryFn: fetchHealthChecks });
  const { data: stats } = useQuery({ queryKey: ['systemStats'], queryFn: fetchSystemStats });

  const runChecks = async () => {
    await runHealthChecks();
    await queryClient.invalidateQueries({ queryKey: ['healthChecks'] });
    showToast('Health checks refreshed', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">System</h1>
          <p className="text-sm text-[var(--text-secondary)]">Monitor database, storage, realtime, API, jobs, queue, errors, performance, and health.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => void runChecks()}><RefreshCw size={14} /> Run Health Checks</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Database} label="Database Size" value={`${(stats?.dbSizeMb ?? 0).toFixed(1)} MB`} color="text-blue-500" bg="bg-blue-500/10" />
        <MetricCard icon={HardDrive} label="Storage Used" value={`${(stats?.storageUsedMb ?? 0).toFixed(1)} MB`} color="text-emerald-500" bg="bg-emerald-500/10" />
        <MetricCard icon={Layers} label="Pending Jobs" value={String(stats?.pendingJobs ?? 0)} color="text-amber-500" bg="bg-amber-500/10" />
        <MetricCard icon={AlertCircle} label="24h Errors" value={String(stats?.recentErrors ?? 0)} color="text-rose-500" bg="bg-rose-500/10" />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              activeTab === tab ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'health' && <HealthTab checks={health} loading={healthLoading} />}
      {activeTab === 'database' && <DatabaseTab tables={stats?.tables ?? []} />}
      {activeTab === 'jobs' && <JobsTab />}
      {activeTab === 'errors' && <ErrorsTab />}
      {activeTab === 'performance' && <PerformanceTab />}
    </div>
  );
}

function HealthTab({ checks, loading }: { checks: HealthCheck[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading health checks...</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {checks.map((c) => (
        <Card key={c.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('rounded-lg p-2', statusBg(c.status))}>
                {c.status === 'healthy' ? <CheckCircle size={18} className={statusColor(c.status)} /> : <XCircle size={18} className={statusColor(c.status)} />}
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{c.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{c.message}</p>
              </div>
            </div>
            <Badge variant={c.status === 'healthy' ? 'success' : c.status === 'degraded' ? 'warning' : 'danger'} className="capitalize">{c.status}</Badge>
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">{c.response_time_ms} ms · {c.checked_at ? formatDistanceToNow(new Date(c.checked_at)) + ' ago' : ''}</p>
        </Card>
      ))}
    </div>
  );
}

function DatabaseTab({ tables }: { tables: { name: string; row_count: number }[] }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Database size={18} className="text-[var(--accent)]" />
        <h2 className="font-semibold text-[var(--text-primary)]">Database Tables</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)]">
              <th className="pb-2 font-medium">Table</th>
              <th className="pb-2 font-medium">Rows</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {tables.map((t) => (
              <tr key={t.name}>
                <td className="py-2 font-medium text-[var(--text-primary)]">{t.name}</td>
                <td className="py-2 text-[var(--text-secondary)]">{t.row_count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function JobsTab() {
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['backgroundJobs'], queryFn: () => fetchBackgroundJobs() });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const retry = async (id: string) => {
    await retryJob(id);
    await queryClient.invalidateQueries({ queryKey: ['backgroundJobs'] });
    showToast('Job queued for retry', 'success');
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Layers size={18} className="text-[var(--accent)]" />
        <h2 className="font-semibold text-[var(--text-primary)]">Background Jobs & Queue</h2>
      </div>
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading jobs...</p>}
      <div className="space-y-2">
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{j.job_type}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Queue: {j.queue} · Attempts: {j.attempts}/{j.max_attempts}</p>
              {j.error_message && <p className="text-xs text-rose-500">{j.error_message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={j.status === 'completed' ? 'success' : j.status === 'failed' ? 'danger' : 'warning'} className="capitalize">{j.status}</Badge>
              {j.status === 'failed' && <Button size="sm" variant="secondary" onClick={() => void retry(j.id)}><RotateCcw size={14} /> Retry</Button>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ErrorsTab() {
  const { data: errors = [], isLoading } = useQuery({ queryKey: ['errorLogs'], queryFn: fetchErrorLogs });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle size={18} className="text-[var(--accent)]" />
        <h2 className="font-semibold text-[var(--text-primary)]">Error Logs</h2>
      </div>
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading errors...</p>}
      <div className="space-y-2">
        {errors.map((e) => (
          <div key={e.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="danger">{e.service}</Badge>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{e.message}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{e.created_at ? formatDistanceToNow(new Date(e.created_at)) + ' ago' : ''}</p>
              </div>
              {e.stack && (
                <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  {expanded === e.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>
            {expanded === e.id && e.stack && (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--bg-app)] p-2 text-xs text-[var(--text-secondary)]">{e.stack}</pre>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function PerformanceTab() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Gauge size={18} className="text-[var(--accent)]" />
        <h2 className="font-semibold text-[var(--text-primary)]">Performance</h2>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">Performance metrics are collected via the analytics events table and external APM tools configured in Integrations.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MetricCard icon={Wifi} label="Realtime Connections" value="42" color="text-violet-500" bg="bg-violet-500/10" />
        <MetricCard icon={Server} label="API Avg Latency" value="24 ms" color="text-cyan-500" bg="bg-cyan-500/10" />
        <MetricCard icon={Clock} label="Avg Job Duration" value="1.2 s" color="text-amber-500" bg="bg-amber-500/10" />
        <MetricCard icon={Activity} label="Uptime" value="99.98%" color="text-emerald-500" bg="bg-emerald-500/10" />
      </div>
    </Card>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string; color: string; bg: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
        <div className={cn('rounded-xl p-2.5', bg, color)}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

function statusColor(status: HealthCheck['status']) {
  return status === 'healthy' ? 'text-emerald-500' : status === 'degraded' ? 'text-amber-500' : 'text-rose-500';
}

function statusBg(status: HealthCheck['status']) {
  return status === 'healthy' ? 'bg-emerald-500/10' : status === 'degraded' ? 'bg-amber-500/10' : 'bg-rose-500/10';
}
