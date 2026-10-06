import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Search, Download, Shield, LogIn, LogOut, Plus, Pencil, Trash2, Upload, FileDown, CheckCircle, XCircle, Calendar, Globe, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { fetchAuditLogs, type AuditAction } from '@/services/auditLogService';

const ACTIONS: { key: AuditAction | ''; label: string; icon: React.ElementType }[] = [
  { key: '', label: 'All Actions', icon: ClipboardList },
  { key: 'login', label: 'Login', icon: LogIn },
  { key: 'logout', label: 'Logout', icon: LogOut },
  { key: 'create', label: 'Create', icon: Plus },
  { key: 'update', label: 'Update', icon: Pencil },
  { key: 'delete', label: 'Delete', icon: Trash2 },
  { key: 'publish', label: 'Publish', icon: CheckCircle },
  { key: 'unpublish', label: 'Unpublish', icon: XCircle },
  { key: 'import', label: 'Import', icon: Upload },
  { key: 'export', label: 'Export', icon: FileDown },
  { key: 'approve', label: 'Approve', icon: CheckCircle },
  { key: 'reject', label: 'Reject', icon: XCircle },
];

const TARGET_TYPES = ['', 'auth', 'user', 'translation', 'reading_plan', 'dictionary_entry', 'topic', 'announcement', 'notification', 'media', 'comment', 'report', 'shared_collection', 'note', 'analytics'];

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [targetType, setTargetType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs', search, action, targetType, from, to],
    queryFn: () => fetchAuditLogs({ search, action: action || undefined, targetType: targetType || undefined, from, to }),
  });

  const exportCsv = () => {
    const header = 'Timestamp,User,Action,Target Type,Target Name,IP Address\n';
    const rows = logs.map((l) => `${l.created_at ?? ' '},${l.action},${l.target_type ?? ' '},${l.ip_address ?? ''}`);
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Audit Logs</h1>
          <p className="text-sm text-[var(--text-secondary)]">Track every login, logout, create, update, delete, publish, import, and export with IP and timestamp.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportCsv}><Download size={14} /> Export CSV</Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
            <Search size={16} className="text-[var(--text-tertiary)]" />
            <Input placeholder="Search user or target..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 bg-transparent p-0 focus:ring-0" />
          </div>
          <select value={action} onChange={(e) => setAction(e.target.value as AuditAction | '')} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
            {ACTIONS.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
          <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
            {TARGET_TYPES.map((t) => (
              <option key={t} value={t}>{t ? t : 'All Targets'}</option>
            ))}
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-hover)]">
              <tr className="text-[var(--text-tertiary)]">
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">Loading audit logs...</td>
                </tr>
              )}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">No audit logs found.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--bg-hover)]">
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[var(--text-primary)]">{log.target_name ?? log.target_id ?? '—'}</span>
                    {log.target_type && <p className="text-[10px] text-[var(--text-tertiary)] capitalize">{log.target_type}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-[var(--text-tertiary)]" />
                      <span className="text-[var(--text-secondary)]">{log.user_email ?? 'System'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Globe size={12} className="text-[var(--text-tertiary)]" />
                      {log.ip_address ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Calendar size={12} className="text-[var(--text-tertiary)]" />
                      {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy HH:mm') : '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ActionBadge({ action }: { action: AuditAction }) {
  const config: Record<AuditAction, { color: string; icon: React.ElementType }> = {
    login: { color: 'bg-emerald-500/10 text-emerald-500', icon: LogIn },
    logout: { color: 'bg-slate-500/10 text-slate-500', icon: LogOut },
    create: { color: 'bg-blue-500/10 text-blue-500', icon: Plus },
    update: { color: 'bg-amber-500/10 text-amber-500', icon: Pencil },
    delete: { color: 'bg-rose-500/10 text-rose-500', icon: Trash2 },
    publish: { color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
    unpublish: { color: 'bg-orange-500/10 text-orange-500', icon: XCircle },
    import: { color: 'bg-violet-500/10 text-violet-500', icon: Upload },
    export: { color: 'bg-cyan-500/10 text-cyan-500', icon: FileDown },
    disable: { color: 'bg-red-500/10 text-red-500', icon: Shield },
    enable: { color: 'bg-green-500/10 text-green-500', icon: Shield },
    approve: { color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
    reject: { color: 'bg-rose-500/10 text-rose-500', icon: XCircle },
    schedule: { color: 'bg-indigo-500/10 text-indigo-500', icon: Calendar },
    send_notification: { color: 'bg-sky-500/10 text-sky-500', icon: LogIn },
  };
  const c = config[action] ?? config.login;
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize', c.color)}>
      <Icon size={12} /> {action.replace('_', ' ')}
    </span>
  );
}
