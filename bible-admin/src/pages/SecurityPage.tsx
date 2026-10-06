import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Smartphone,
  Monitor,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow, format } from 'date-fns';
import { fetchSessions, revokeSession, fetchLoginHistory, fetchRateLimits, updateRateLimit, type Session, type LoginRecord, type RateLimit } from '@/services/securityService';
import { fetchSettings, updateSetting, type PlatformSettings } from '@/services/settingsService';

const TABS = ['2fa', 'sessions', 'password', 'login-history', 'devices', 'rate-limits'] as const;
type Tab = (typeof TABS)[number];

export function SecurityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('2fa');
  const { data: sessions = [] } = useQuery({ queryKey: ['securitySessions'], queryFn: fetchSessions });
  const { data: loginHistory = [] } = useQuery({ queryKey: ['loginHistory'], queryFn: fetchLoginHistory });
  const { data: rateLimits = [] } = useQuery({ queryKey: ['rateLimits'], queryFn: fetchRateLimits });
  const { data: settings } = useQuery({ queryKey: ['platformSettings'], queryFn: fetchSettings });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Security</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage 2FA, sessions, password policy, login history, devices, and rate limiting.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Shield} label="MFA Required" value={settings?.security.mfaRequired ? 'Yes' : 'No'} color="text-blue-500" bg="bg-blue-500/10" />
        <MetricCard icon={Monitor} label="Active Sessions" value={String(sessions.length)} color="text-emerald-500" bg="bg-emerald-500/10" />
        <MetricCard icon={History} label="Login Events" value={String(loginHistory.length)} color="text-amber-500" bg="bg-amber-500/10" />
        <MetricCard icon={AlertTriangle} label="Failed/Blocked" value={String(loginHistory.filter((l) => l.status !== 'success').length)} color="text-rose-500" bg="bg-rose-500/10" />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {tab.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {activeTab === '2fa' && <MfaTab settings={settings} />}
      {activeTab === 'sessions' && <SessionsTab sessions={sessions} />}
      {activeTab === 'password' && <PasswordPolicyTab settings={settings} />}
      {activeTab === 'login-history' && <LoginHistoryTab records={loginHistory} />}
      {activeTab === 'devices' && <DevicesTab sessions={sessions} />}
      {activeTab === 'rate-limits' && <RateLimitsTab rateLimits={rateLimits} />}
    </div>
  );
}

function MfaTab({ settings }: { settings: PlatformSettings | undefined }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const enabled = settings?.security.mfaRequired ?? false;

  const toggle = async () => {
    if (!settings) return;
    await updateSetting('security', { ...settings.security, mfaRequired: !enabled });
    await queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
    showToast(`MFA ${enabled ? 'disabled' : 'enabled'}`, 'success');
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Two-Factor Authentication</h2>
          <p className="text-sm text-[var(--text-secondary)]">Require all admin users to enable TOTP-based 2FA.</p>
        </div>
        <div className={cn('rounded-lg p-2', enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500')}>
          <Shield size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={enabled} onChange={() => void toggle()} className="peer sr-only" />
          <div className="peer h-6 w-11 rounded-full bg-[var(--bg-hover)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-full" />
        </label>
        <span className="text-sm font-medium text-[var(--text-primary)]">{enabled ? 'Required for all admins' : 'Optional'}</span>
      </div>
    </Card>
  );
}

function SessionsTab({ sessions }: { sessions: Session[] }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const revoke = async (id: string) => {
    await revokeSession(id);
    await queryClient.invalidateQueries({ queryKey: ['securitySessions'] });
    showToast('Session revoked', 'success');
  };

  const revokeAll = async () => {
    await Promise.all(sessions.map((s) => revokeSession(s.id)));
    await queryClient.invalidateQueries({ queryKey: ['securitySessions'] });
    showToast('All other sessions revoked', 'success');
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Sessions</h2>
        <Button size="sm" variant="danger" onClick={() => void revokeAll()}><Trash2 size={14} /> Revoke All</Button>
      </div>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{s.device_name ?? 'Unknown device'} · {s.device_type}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{s.ip_address} · Active {s.last_active_at ? formatDistanceToNow(new Date(s.last_active_at)) + ' ago' : ''}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => void revoke(s.id)}><Trash2 size={14} /> Revoke</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PasswordPolicyTab({ settings }: { settings: PlatformSettings | undefined }) {
  const [form, setForm] = useState(settings?.security ?? { mfaRequired: false, sessionTimeoutMinutes: 60, passwordMinLength: 8, requirePasswordChangeDays: 90 });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const save = async () => {
    await updateSetting('security', form);
    await queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
    showToast('Password policy saved', 'success');
  };

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Password Policy</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Minimum Length"><Input type="number" value={form.passwordMinLength} onChange={(e) => setForm((s) => ({ ...s, passwordMinLength: parseInt(e.target.value) || 0 }))} /></Field>
        <Field label="Require Change (days)"><Input type="number" value={form.requirePasswordChangeDays} onChange={(e) => setForm((s) => ({ ...s, requirePasswordChangeDays: parseInt(e.target.value) || 0 }))} /></Field>
        <Field label="Session Timeout (min)"><Input type="number" value={form.sessionTimeoutMinutes} onChange={(e) => setForm((s) => ({ ...s, sessionTimeoutMinutes: parseInt(e.target.value) || 0 }))} /></Field>
      </div>
      <Button className="mt-4" onClick={() => void save()}><Save size={14} /> Save</Button>
    </Card>
  );
}

function LoginHistoryTab({ records }: { records: LoginRecord[] }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Login History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)]">
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">IP Address</th>
              <th className="pb-2 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="py-2"><StatusBadge status={r.status} /></td>
                <td className="py-2 text-[var(--text-secondary)]">{r.ip_address ?? '—'}</td>
                <td className="py-2 text-[var(--text-secondary)]">{r.created_at ? format(new Date(r.created_at), 'MMM d, HH:mm') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DevicesTab({ sessions }: { sessions: Session[] }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Device Management</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((s) => (
          <div key={s.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div className="flex items-center gap-2">
              {s.device_type === 'mobile' ? <Smartphone size={18} className="text-[var(--accent)]" /> : <Monitor size={18} className="text-[var(--accent)]" />}
              <p className="font-medium text-[var(--text-primary)]">{s.device_name ?? 'Unknown'}</p>
            </div>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{s.ip_address}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Last active {s.last_active_at ? formatDistanceToNow(new Date(s.last_active_at)) + ' ago' : '—'}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RateLimitsTab({ rateLimits }: { rateLimits: RateLimit[] }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [local, setLocal] = useState<Record<string, RateLimit>>(() => Object.fromEntries(rateLimits.map((r) => [r.id, r])));

  const save = async (id: string) => {
    const rule = local[id];
    if (!rule) return;
    await updateRateLimit(id, { window_seconds: rule.window_seconds, max_requests: rule.max_requests });
    await queryClient.invalidateQueries({ queryKey: ['rateLimits'] });
    showToast('Rate limit updated', 'success');
  };

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Rate Limiting</h2>
      <div className="space-y-3">
        {rateLimits.map((r) => (
          <div key={r.id} className="grid items-end gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3 sm:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{r.key}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{r.window_seconds}s window</p>
            </div>
            <Field label="Window (s)">
              <Input type="number" value={local[r.id]?.window_seconds ?? r.window_seconds} onChange={(e) => setLocal((s) => ({ ...s, [r.id]: { ...r, window_seconds: parseInt(e.target.value) || 0 } }))} />
            </Field>
            <Field label="Max Requests">
              <Input type="number" value={local[r.id]?.max_requests ?? r.max_requests} onChange={(e) => setLocal((s) => ({ ...s, [r.id]: { ...r, max_requests: parseInt(e.target.value) || 0 } }))} />
            </Field>
            <Button size="sm" onClick={() => void save(r.id)}><RefreshCw size={14} /> Update</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: LoginRecord['status'] }) {
  const config = {
    success: { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500' },
    failed: { icon: XCircle, color: 'bg-amber-500/10 text-amber-500' },
    blocked: { icon: AlertTriangle, color: 'bg-rose-500/10 text-rose-500' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${c.color}`}>
      <Icon size={12} /> {status}
    </span>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      {children}
    </div>
  );
}
