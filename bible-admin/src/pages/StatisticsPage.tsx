import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, StickyNote, Highlighter, HandHeart, BookText, HardDrive, Server, AlertTriangle, RefreshCw, Activity, Zap, Ban, } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchPlatformStats, getHourlyActivity, type RecentActivity, type SystemAlert } from '@/services/statsService';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/utils/cn';

const CONTAINER = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function StatisticsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['platformStats'],
    queryFn: fetchPlatformStats,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const activities: RecentActivity[] = [];
  const alerts: SystemAlert[] = [];
  const hourly = getHourlyActivity();

  useEffect(() => {
    document.title = 'Statistics | Bible Admin';
  }, []);

  const statCards = [
    { label: "Today's Active Users", value: stats?.activeUsersToday ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Reading Sessions', value: stats?.readingSessions ?? 0, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Notes Created', value: stats?.notesCreated ?? 0, icon: StickyNote, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Highlights', value: stats?.highlights ?? 0, icon: Highlighter, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Prayer Requests', value: stats?.prayerRequests ?? 0, icon: HandHeart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Journal Entries', value: stats?.journalEntries ?? 0, icon: BookText, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Real-time Statistics</h1>
          <p className="text-sm text-[var(--text-secondary)]">Live platform metrics and system health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => void refetch()} disabled={isLoading}>
            <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} /> Refresh
          </Button>
          <button
            onClick={() => setAutoRefresh((s) => !s)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              autoRefresh
                ? 'border-green-500/30 bg-green-500/10 text-green-500'
                : 'border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]'
            )}
          >
            Auto-refresh {autoRefresh ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <motion.div variants={CONTAINER} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} variants={ITEM}>
              <Card className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                      {s.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={cn('rounded-xl p-2.5', s.bg, s.color)}>
                    <Icon size={20} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={ITEM} className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">24-Hour Activity</h2>
              <Badge variant="info">Live</Badge>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly}>
                  <defs>
                    <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={2} fill="url(#usersGradient)" />
                  <Area type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={ITEM}>
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Server Status</h2>
            <div className="space-y-4">
              <StatusRow label="API" status={stats?.serverStatus === 'operational' ? 'operational' : 'degraded'} />
              <StatusRow label="Database" status="operational" />
              <StatusRow label="Storage" status="operational" />
              <StatusRow label="Auth" status="operational" />
              <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    <HardDrive size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Storage Usage</p>
                    <p className="text-xs text-[var(--text-secondary)]">{stats?.storageUsageMB ?? 0} MB used</p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-[var(--bg-active)]">
                  <div
                    className="h-2 rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.min(100, ((stats?.storageUsageMB ?? 0) / 1024) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={ITEM} className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Content Trends</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly}>
                  <XAxis dataKey="hour" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                  <Bar dataKey="users" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sessions" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={ITEM}>
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-[var(--text-primary)]">System Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3',
                    alert.severity === 'critical'
                      ? 'border-red-500/30 bg-red-500/10'
                      : alert.severity === 'warning'
                        ? 'border-yellow-500/30 bg-yellow-500/10'
                        : 'border-blue-500/30 bg-blue-500/10'
                  )}
                >
                  <AlertTriangle
                    size={18}
                    className={cn(
                      'mt-0.5',
                      alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{alert.message}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{formatDistanceToNow(new Date(alert.timestamp))} ago</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={ITEM} className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Recent Activity</h2>
            <div className="space-y-3">
              {activities.map((a) => {
                const icon = ACTIVITY_ICONS[a.type];
                const Icon = icon.icon;
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--bg-hover)]">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', icon.bg, icon.color)}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--text-primary)]">{a.message}</p>
                      {a.user && <p className="text-xs text-[var(--text-tertiary)]">by {a.user}</p>}
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">{formatDistanceToNow(new Date(a.timestamp))} ago</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={ITEM}>
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Quick Actions</h2>
            <div className="grid gap-2">
              <Button variant="secondary" size="sm" className="justify-start"><Activity size={14} /> View audit log</Button>
              <Button variant="secondary" size="sm" className="justify-start"><Zap size={14} /> Run health check</Button>
              <Button variant="secondary" size="sm" className="justify-start"><Server size={14} /> Restart services</Button>
              <Button variant="danger" size="sm" className="justify-start"><Ban size={14} /> Ban user</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatusRow({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
      <div className="flex items-center gap-2">
        <Server size={14} className="text-[var(--text-tertiary)]" />
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
      </div>
      <Badge
        variant={status === 'operational' ? 'success' : status === 'degraded' ? 'warning' : 'danger'}
        className="capitalize"
      >
        {status}
      </Badge>
    </div>
  );
}

const ACTIVITY_ICONS: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  note: { icon: StickyNote, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  sermon: { icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  prayer: { icon: HandHeart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  journal: { icon: BookText, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  highlight: { icon: Highlighter, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  user: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};
