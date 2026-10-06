import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Globe, Smartphone, BookOpen, Search, Clock, TrendingUp, Monitor } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import {
  fetchDauMau,
  fetchRetention,
  fetchDeviceBreakdown,
  fetchCountryBreakdown,
  fetchPopularBooks,
  fetchPopularChapters,
  fetchPopularVerses,
  fetchSearchAnalytics,
  fetchReadingTime,
  formatDuration,
} from '@/services/analyticsService';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const TABS = ['overview', 'content', 'search', 'audience'] as const;
type Tab = (typeof TABS)[number];

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [days, setDays] = useState(30);

  const { data: dauMau = [] } = useQuery({ queryKey: ['dauMau', days], queryFn: () => fetchDauMau(days) });
  const { data: retention = [] } = useQuery({ queryKey: ['retention'], queryFn: fetchRetention });
  const { data: devices = [] } = useQuery({ queryKey: ['deviceBreakdown'], queryFn: fetchDeviceBreakdown });
  const { data: countries = [] } = useQuery({ queryKey: ['countryBreakdown'], queryFn: fetchCountryBreakdown });
  const { data: books = [] } = useQuery({ queryKey: ['popularBooks'], queryFn: fetchPopularBooks });
  const { data: chapters = [] } = useQuery({ queryKey: ['popularChapters'], queryFn: fetchPopularChapters });
  const { data: verses = [] } = useQuery({ queryKey: ['popularVerses'], queryFn: fetchPopularVerses });
  const { data: searches = [] } = useQuery({ queryKey: ['searchAnalytics'], queryFn: fetchSearchAnalytics });
  const { data: readingTime = [] } = useQuery({ queryKey: ['readingTime', days], queryFn: () => fetchReadingTime(days) });

  const totalSeconds = readingTime.reduce((acc, d) => acc + (d.seconds ?? 0), 0);
  const latestDau = dauMau[dauMau.length - 1]?.dau ?? 0;
  const latestMau = dauMau[dauMau.length - 1]?.mau ?? 0;

  const exportCsv = () => {
    const rows = dauMau.map((d) => ({ Day: d.day, DAU: d.dau, MAU: d.mau }));
    const csv = ['Day,DAU,MAU', ...rows.map((r) => `${r.Day},${r.DAU},${r.MAU}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
          <p className="text-sm text-[var(--text-secondary)]">Product analytics, engagement, content performance, and exportable reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button size="sm" variant="secondary" onClick={exportCsv}><Download size={14} /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users} label="DAU" value={latestDau.toLocaleString()} trend="+5%" color="text-blue-500" bg="bg-blue-500/10" />
        <MetricCard icon={TrendingUp} label="MAU" value={latestMau.toLocaleString()} trend="+12%" color="text-emerald-500" bg="bg-emerald-500/10" />
        <MetricCard icon={Clock} label="Total Reading Time" value={formatDuration(totalSeconds)} trend="" color="text-amber-500" bg="bg-amber-500/10" />
        <MetricCard icon={BookOpen} label="Top Book" value={books[0]?.label ?? '—'} trend="" color="text-violet-500" bg="bg-violet-500/10" />
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

      {activeTab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="DAU / MAU Trend" icon={Monitor}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dauMau}>
                <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} />
                <Line type="monotone" dataKey="dau" stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mau" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Reading Time (seconds/day)" icon={Clock}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={readingTime}>
                <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} />
                <Bar dataKey="seconds" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Retention Cohorts" icon={TrendingUp}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)]">
                    <th className="pb-2 font-medium">Cohort</th>
                    <th className="pb-2 font-medium">Size</th>
                    <th className="pb-2 font-medium">D1</th>
                    <th className="pb-2 font-medium">D7</th>
                    <th className="pb-2 font-medium">D30</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {retention.map((r) => (
                    <tr key={r.cohort_day}>
                      <td className="py-2 text-[var(--text-primary)]">{r.cohort_day}</td>
                      <td className="py-2 text-[var(--text-secondary)]">{r.cohort_size}</td>
                      <td className="py-2 text-[var(--text-secondary)]">{r.d1_return}</td>
                      <td className="py-2 text-[var(--text-secondary)]">{r.d7_return}</td>
                      <td className="py-2 text-[var(--text-secondary)]">{r.d30_return}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'audience' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Devices" icon={Smartphone}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={devices} dataKey="users" nameKey="label" outerRadius={80} label>
                  {devices.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2">
              {devices.map((d, i) => (
                <div key={d.label} className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /> {d.label} ({d.users})
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Top Countries" icon={Globe}>
            <div className="space-y-2">
              {countries.map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="w-24 truncate text-sm text-[var(--text-primary)]">{c.label}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-[var(--bg-hover)]">
                      <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (c.users / (countries[0]?.users || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs text-[var(--text-secondary)]">{c.users}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <TopListCard title="Most Read Books" icon={BookOpen} items={books} />
          <TopListCard title="Popular Chapters" icon={BookOpen} items={chapters} />
          <TopListCard title="Popular Verses" icon={BookOpen} items={verses} />
        </div>
      )}

      {activeTab === 'search' && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Search size={18} className="text-[var(--accent)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">Top Search Terms</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)]">
                  <th className="pb-2 font-medium">Query</th>
                  <th className="pb-2 font-medium">Searches</th>
                  <th className="pb-2 font-medium">Searchers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {searches.map((s) => (
                  <tr key={s.query}>
                    <td className="py-2 text-[var(--text-primary)]">{s.query}</td>
                    <td className="py-2 text-[var(--text-secondary)]">{s.searches}</td>
                    <td className="py-2 text-[var(--text-secondary)]">{s.searchers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, color, bg }: { icon: React.ElementType; label: string; value: string; trend: string; color: string; bg: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          {trend && <p className="text-xs text-emerald-500">{trend}</p>}
        </div>
        <div className={cn('rounded-xl p-2.5', bg, color)}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} className="text-[var(--accent)]" />
        <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function TopListCard({ title, icon: Icon, items }: { title: string; icon: React.ElementType; items: { label: string; reads?: number; readers: number }[] }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} className="text-[var(--accent)]" />
        <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <Badge variant="default" className="h-5 w-5 justify-center rounded-full p-0 text-[10px]">{i + 1}</Badge>
            <span className="flex-1 truncate text-sm text-[var(--text-primary)]">{item.label}</span>
            <span className="text-xs text-[var(--text-tertiary)]">{item.reads ?? item.readers}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
