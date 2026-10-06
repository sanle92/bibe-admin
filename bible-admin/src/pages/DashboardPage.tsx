import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  HandHeart,
  BookText,
  TrendingUp,
  Activity,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { IndexTable, type Column } from '@/components/ui/IndexTable';
import { cn } from '@/utils/cn';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const stats = [
  { label: 'Total Users', value: 1240, change: '+12%', icon: Users },
  { label: 'Notes Created', value: 8421, change: '+8%', icon: FileText },
  { label: 'Prayers', value: 1532, change: '+24%', icon: HandHeart },
  { label: 'Journal Entries', value: 3890, change: '+18%', icon: BookText },
];

const activity = [
  { name: 'Mon', users: 120, notes: 240, prayers: 80 },
  { name: 'Tue', users: 132, notes: 300, prayers: 90 },
  { name: 'Wed', users: 101, notes: 210, prayers: 70 },
  { name: 'Thu', users: 154, notes: 320, prayers: 110 },
  { name: 'Fri', users: 190, notes: 280, prayers: 120 },
  { name: 'Sat', users: 230, notes: 410, prayers: 140 },
  { name: 'Sun', users: 210, notes: 390, prayers: 130 },
];

const plans = [
  { name: '365 Days', value: 45 },
  { name: '90 Days', value: 25 },
  { name: '30 Days', value: 15 },
  { name: 'Custom', value: 15 },
];

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'];

type Period = 'today' | 'week' | 'month';

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  resource: string;
  time: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

const recentActivity: RecentActivity[] = [
  { id: '1', user: 'Esther M.', action: 'Created a note', resource: 'Genesis 1:1-5', time: '2 min ago', status: 'info' },
  { id: '2', user: 'Daniel K.', action: 'Started a prayer', resource: 'Daily Prayer', time: '15 min ago', status: 'success' },
  { id: '3', user: 'Ruth A.', action: 'Completed a reading plan', resource: '30 Days', time: '1 hr ago', status: 'success' },
  { id: '4', user: 'Paul O.', action: 'Updated a sermon', resource: 'Sunday Sermon', time: '3 hr ago', status: 'warning' },
  { id: '5', user: 'Mary J.', action: 'Joined the community', resource: 'Community group', time: '5 hr ago', status: 'info' },
  { id: '6', user: 'John D.', action: 'Reported content', resource: 'Comment #42', time: '8 hr ago', status: 'danger' },
];

const columns: Column<RecentActivity>[] = [
  {
    key: 'user',
    title: 'User',
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <User size={14} />
        </div>
        <span className="font-medium text-[var(--text-primary)]">{row.user}</span>
      </div>
    ),
  },
  { key: 'action', title: 'Action' },
  {
    key: 'resource',
    title: 'Resource',
    render: (row) => <span className="text-[var(--text-secondary)]">{row.resource}</span>,
  },
  { key: 'time', title: 'Time', width: '120px' },
  {
    key: 'status',
    title: 'Status',
    width: '100px',
    render: (row) => (
      <Badge variant={row.status} className="capitalize">
        {row.status}
      </Badge>
    ),
  },
];

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>('week');

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="Overview"
        description="Track key metrics, content activity, and community growth."
        primaryAction={{ label: 'Export report', icon: Download }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  period === p
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
              <Calendar size={14} />
              <span>Jul 4 – Jul 10, 2026</span>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
              <Filter size={16} />
            </button>
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{stat.value.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-[var(--bg-hover)] p-2 text-[var(--accent)]">
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <TrendingUp size={14} className="text-green-500" />
                <span className="font-medium text-green-500">{stat.change}</span>
                <span className="text-[var(--text-tertiary)]">vs last {period}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">Activity</h2>
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <Activity size={14} />
              Last 7 days
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="users" stroke={COLORS[0]} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="notes" stroke={COLORS[1]} fillOpacity={0} fill="transparent" />
                <Area type="monotone" dataKey="prayers" stroke={COLORS[2]} fillOpacity={0} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Reading Plans</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={plans} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {plans.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {plans.map((plan, i) => (
              <div key={plan.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-[var(--text-secondary)]">{plan.name}</span>
                </div>
                <span className="font-medium text-[var(--text-primary)]">{plan.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Recent activity</h2>
            <p className="text-sm text-[var(--text-secondary)]">Latest actions across the platform.</p>
          </div>
          <Button variant="ghost" size="sm" className="text-[var(--accent)]">
            View all
            <ArrowUpRight size={14} className="ml-1" />
          </Button>
        </div>
        <IndexTable columns={columns} rows={recentActivity} getRowKey={(row) => row.id} />
      </Card>
    </motion.div>
  );
}
