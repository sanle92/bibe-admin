import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, Filter, Shield, Smartphone, HardDrive, BookOpen, StickyNote, Highlighter, Ban, Trash2, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { IndexTable, type Column } from '@/components/ui/IndexTable';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import { fetchUsers, setUserRole, setUserStatus, deleteUserAccount, type AdminUser, type UserRole } from '@/services/usersService';

const ROLE_OPTIONS: UserRole[] = ['super', 'admin', 'moderator', 'viewer'];

const columns: Column<AdminUser>[] = [
  {
    key: 'user',
    title: 'User',
    render: (u) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-active)] text-[var(--text-secondary)]">
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <User size={14} />
          )}
        </div>
        <div>
          <p className="font-medium text-[var(--text-primary)]">{u.displayName ?? u.email}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{u.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'roles',
    title: 'Roles',
    render: (u) => (
      <div className="flex flex-wrap gap-1">
        {u.roles.map((r) => (
          <Badge key={r} variant={r === 'super' ? 'info' : 'default'} className="capitalize">
            {r}
          </Badge>
        ))}
        {u.roles.length === 0 && <span className="text-xs text-[var(--text-tertiary)]">—</span>}
      </div>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    width: '100px',
    render: (u) => (
      <Badge variant={u.status === 'active' ? 'success' : 'danger'} className="capitalize">
        {u.status}
      </Badge>
    ),
  },
  {
    key: 'lastLogin',
    title: 'Last Login',
    width: '140px',
    render: (u) => (
      <span className="text-[var(--text-secondary)]">
        {u.lastLoginAt ? formatDistanceToNow(new Date(u.lastLoginAt)) + ' ago' : 'Never'}
      </span>
    ),
  },
  {
    key: 'joined',
    title: 'Joined',
    width: '120px',
    render: (u) => (
      <span className="text-[var(--text-secondary)]">{format(new Date(u.createdAt), 'MMM d, yyyy')}</span>
    ),
  },
];

export function UsersPage() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: users = [], isLoading } = useQuery({ queryKey: ['adminUsers'], queryFn: fetchUsers });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const filtered = users.filter((u) =>
    [u.displayName ?? '', u.email].some((f) => f.toLowerCase().includes(query.toLowerCase()))
  );

  const selected = users.find((u) => u.id === selectedId);

  const updateRole = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: UserRole[] }) => setUserRole(userId, roles),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ userId, disabled }: { userId: string; disabled: boolean }) => setUserStatus(userId, disabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  const deleteAccount = useMutation({
    mutationFn: (userId: string) => deleteUserAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setSelectedId(null);
      showToast('Account deleted', 'success');
    },
  });

  const toggleRole = (userId: string, current: UserRole[], role: UserRole) => {
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
    void updateRole.mutate({ userId, roles: next });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Manage community accounts, roles, and statuses."
        primaryAction={{ label: 'Invite user' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2 sm:max-w-xs">
            <Search size={16} className="text-[var(--text-tertiary)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="border-0 bg-transparent p-0 focus:ring-0"
            />
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            <Filter size={16} />
          </button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-4">
            {isLoading ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading users...</p>
            ) : (
              <IndexTable
                columns={columns}
                rows={filtered}
                getRowKey={(u) => u.id}
                onRowClick={(u) => setSelectedId(u.id)}
                selectedRowKey={selectedId ?? undefined}
                emptyText="No users found."
              />
            )}
          </Card>
        </div>

        <div>
          {selected ? (
            <UserDetailCard
              user={selected}
              onToggleRole={(role) => toggleRole(selected.id, selected.roles, role)}
              onToggleStatus={() => updateStatus.mutate({ userId: selected.id, disabled: selected.status === 'active' })}
              onDelete={() => deleteAccount.mutate(selected.id)}
            />
          ) : (
            <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
              <User size={32} className="mb-3 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Select a user to view profile, roles, devices, and activity.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function UserDetailCard({
  user,
  onToggleRole,
  onToggleStatus,
  onDelete,
}: {
  user: AdminUser;
  onToggleRole: (role: UserRole) => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const stats = [
    { label: 'Notes', value: user.stats.notesCount, icon: StickyNote, color: 'text-violet-500' },
    { label: 'Highlights', value: user.stats.highlightsCount, icon: Highlighter, color: 'text-amber-500' },
    { label: 'Reading Days', value: user.stats.readingDays, icon: BookOpen, color: 'text-emerald-500' },
    { label: 'Prayers', value: user.stats.prayersCount, icon: Smartphone, color: 'text-rose-500' },
  ];

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-active)] text-[var(--text-secondary)]">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <User size={24} />
          )}
        </div>
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">{user.displayName ?? user.email}</h2>
          <p className="text-xs text-[var(--text-tertiary)]">{user.email}</p>
          <Badge variant={user.status === 'active' ? 'success' : 'danger'} className="mt-1 capitalize">{user.status}</Badge>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
              <div className="mb-1 flex items-center gap-2 text-[var(--text-tertiary)]">
                <Icon size={14} className={s.color} />
                <span className="text-xs">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-5">
        <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--text-tertiary)]">Roles & Permissions</h3>
        <div className="space-y-2">
          {ROLE_OPTIONS.map((role) => {
            const active = user.roles.includes(role);
            return (
              <button
                key={role}
                onClick={() => onToggleRole(role)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  active ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                )}
              >
                <span className="flex items-center gap-2 capitalize">
                  <Shield size={14} /> {role}
                </span>
                {active ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--text-tertiary)]">Devices</h3>
        <div className="space-y-2">
          {user.devices.length === 0 && <p className="text-xs text-[var(--text-tertiary)]">No devices recorded.</p>}
          {user.devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <Smartphone size={14} className="text-[var(--text-tertiary)]" />
                {d.deviceName ?? 'Unknown device'}
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">{d.lastIp}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--text-tertiary)]">Storage & Activity</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
            <span className="flex items-center gap-2 text-[var(--text-secondary)]"><HardDrive size={14} /> Journal entries</span>
            <span className="font-medium text-[var(--text-primary)]">{user.stats.journalCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
            <span className="flex items-center gap-2 text-[var(--text-secondary)]"><BookOpen size={14} /> Active plans</span>
            <span className="font-medium text-[var(--text-primary)]">{user.stats.activePlans}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
            <span className="text-[var(--text-secondary)]">Last login</span>
            <span className="font-medium text-[var(--text-primary)]">{user.lastLoginAt ? formatDistanceToNow(new Date(user.lastLoginAt)) + ' ago' : 'Never'}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onToggleStatus}>
          <Ban size={14} /> {user.status === 'active' ? 'Disable Account' : 'Enable Account'}
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete}>
          <Trash2 size={14} /> Delete
        </Button>
      </div>
    </Card>
  );
}
