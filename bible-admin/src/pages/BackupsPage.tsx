import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Plus, Download, RotateCcw, Trash2, Clock, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow, format } from 'date-fns';
import { fetchBackups, createBackup, restoreBackup, deleteBackup, downloadBackup, type Backup } from '@/services/backupsService';

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export function BackupsPage() {
  const { data: backups = [], isLoading } = useQuery({ queryKey: ['backups'], queryFn: fetchBackups });
  const [name, setName] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const create = async () => {
    const backup = await createBackup(name || 'Manual Backup', 'manual');
    if (backup) {
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['backups'] });
      showToast('Backup started', 'success');
    }
  };

  const restore = async (backup: Backup) => {
    setRestoringId(backup.id);
    const result = await restoreBackup(backup.id);
    setRestoringId(null);
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const remove = async (id: string) => {
    await deleteBackup(id);
    await queryClient.invalidateQueries({ queryKey: ['backups'] });
    showToast('Backup deleted', 'success');
  };

  const automaticCount = backups.filter((b) => b.type === 'automatic' && b.status === 'completed').length;
  const manualCount = backups.filter((b) => b.type === 'manual' && b.status === 'completed').length;
  const totalSize = backups.reduce((acc, b) => acc + (b.size_bytes ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Backups</h1>
          <p className="text-sm text-[var(--text-secondary)]">Schedule automatic backups, run manual backups, restore, download, and view history.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Calendar} label="Automatic Backups" value={String(automaticCount)} color="text-blue-500" bg="bg-blue-500/10" />
        <MetricCard icon={Database} label="Manual Backups" value={String(manualCount)} color="text-emerald-500" bg="bg-emerald-500/10" />
        <MetricCard icon={Database} label="Total Backups" value={String(backups.length)} color="text-violet-500" bg="bg-violet-500/10" />
        <MetricCard icon={Clock} label="Total Size" value={formatBytes(totalSize)} color="text-amber-500" bg="bg-amber-500/10" />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold text-[var(--text-primary)]">Manual Backup</h2>
        <div className="flex gap-2">
          <Input placeholder="Backup name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => void create()}><Plus size={14} /> Create Backup</Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold text-[var(--text-primary)]">Backup History</h2>
        {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading backups...</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)]">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Size</th>
                <th className="pb-2 font-medium">Started</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-[var(--bg-hover)]">
                  <td className="py-3 font-medium text-[var(--text-primary)]">{b.name}</td>
                  <td className="py-3 text-[var(--text-secondary)] capitalize">{b.type}</td>
                  <td className="py-3"><StatusBadge status={b.status} /></td>
                  <td className="py-3 text-[var(--text-secondary)]">{formatBytes(b.size_bytes)}</td>
                  <td className="py-3 text-[var(--text-secondary)]">{b.started_at ? format(new Date(b.started_at), 'MMM d, HH:mm') : '—'}</td>
                  <td className="py-3 text-[var(--text-secondary)]">
                    {b.started_at && b.completed_at
                      ? formatDistanceToNow(new Date(b.started_at), { addSuffix: false })
                      : b.started_at
                        ? formatDistanceToNow(new Date(b.started_at)) + ' ago'
                        : '—'}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.status === 'completed' && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => downloadBackup(b)}><Download size={14} /></Button>
                          <Button size="sm" variant="secondary" onClick={() => void restore(b)} disabled={restoringId === b.id}><RotateCcw size={14} /> {restoringId === b.id ? '...' : 'Restore'}</Button>
                        </>
                      )}
                      <Button size="sm" variant="danger" onClick={() => void remove(b.id)}><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && backups.length === 0 && <p className="mt-3 text-sm text-[var(--text-tertiary)]">No backups found.</p>}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: Backup['status'] }) {
  const config = {
    completed: { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500' },
    in_progress: { icon: Loader2, color: 'bg-amber-500/10 text-amber-500' },
    failed: { icon: XCircle, color: 'bg-rose-500/10 text-rose-500' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${c.color}`}>
      <Icon size={12} className={status === 'in_progress' ? 'animate-spin' : ''} /> {status.replace('_', ' ')}
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
        <div className={`rounded-xl p-2.5 ${bg} ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}
