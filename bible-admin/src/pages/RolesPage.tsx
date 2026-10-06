import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import { fetchRoles, fetchPermissions, updateRole, createRole, deleteRole, setRolePermissions, type Role, type Permission } from '@/services/rolesService';

export function RolesPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { data: roles = [], isLoading: rolesLoading } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles });
  const { data: permissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions });
  const selected = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Roles & Permissions</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage Super Admin, Administrator, Editor, Translator, Support, Moderator, Author, and custom roles.</p>
        </div>
        <Button size="sm" onClick={() => { setSelectedRoleId(null); setShowCreate(true); }}><Plus size={14} /> Custom Role</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          {rolesLoading && <p className="text-sm text-[var(--text-secondary)]">Loading roles...</p>}
          {roles.map((role) => (
            <Card
              key={role.id}
              className={cn('cursor-pointer p-4 transition-colors hover:border-[var(--accent)]', selectedRoleId === role.id && 'border-[var(--accent)] bg-[var(--accent-soft)]')}
              onClick={() => { setSelectedRoleId(role.id); setShowCreate(false); }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={18} className={role.is_system ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'} />
                  <h2 className="font-semibold text-[var(--text-primary)]">{role.name}</h2>
                </div>
                {role.is_system ? <Badge variant="info">System</Badge> : <Badge variant="default">Custom</Badge>}
              </div>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{role.description}</p>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{role.permissions.length} permissions</p>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {showCreate ? (
            <CreateRoleForm permissions={permissions} onClose={() => setShowCreate(false)} />
          ) : selected ? (
            <RoleEditor role={selected} permissions={permissions} />
          ) : (
            <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Shield size={32} className="mb-3 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Select a role to edit permissions or create a custom role.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleEditor({ role, permissions }: { role: Role; permissions: Permission[] }) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions));
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const byCategory = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const p of permissions) {
      groups[p.category] = groups[p.category] ?? [];
      groups[p.category].push(p);
    }
    return groups;
  }, [permissions]);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const save = async () => {
    await updateRole(role.id, { name, description });
    await setRolePermissions(role.id, Array.from(selected));
    await queryClient.invalidateQueries({ queryKey: ['roles'] });
    showToast('Role updated', 'success');
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{role.name}</h2>
          <Badge variant={role.is_system ? 'info' : 'default'} className="mt-1">{role.is_system ? 'System' : 'Custom'}</Badge>
        </div>
        {!role.is_system && <DeleteButton role={role} />}
      </div>

      <div className="mb-4 space-y-3">
        <Input placeholder="Role name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--text-tertiary)]">Permissions</h3>
      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, perms]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)] capitalize">{category}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {perms.map((p) => {
                const active = selected.has(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => toggle(p.key)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                      active ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    )}
                  >
                    <span>
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-[10px] text-[var(--text-tertiary)]">{p.description}</span>
                    </span>
                    {active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={() => void save()}><Check size={14} /> Save Changes</Button>
      </div>
    </Card>
  );
}

function CreateRoleForm({ permissions, onClose }: { permissions: Permission[]; onClose: () => void }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const byCategory = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const p of permissions) {
      groups[p.category] = groups[p.category] ?? [];
      groups[p.category].push(p);
    }
    return groups;
  }, [permissions]);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const save = async () => {
    if (!key.trim() || !name.trim()) return;
    await createRole({ key: key.trim(), name: name.trim(), description, is_system: false, is_custom: true, permissions: Array.from(selected) });
    await queryClient.invalidateQueries({ queryKey: ['roles'] });
    onClose();
    showToast('Custom role created', 'success');
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Create Custom Role</h2>
        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Input placeholder="Key (e.g. custom-role)" value={key} onChange={(e) => setKey(e.target.value)} />
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="mb-4" />

      <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--text-tertiary)]">Permissions</h3>
      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, perms]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)] capitalize">{category}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {perms.map((p) => {
                const active = selected.has(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => toggle(p.key)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                      active ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    )}
                  >
                    <span>{p.name}</span>
                    {active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={() => void save()}><Plus size={14} /> Create Role</Button>
      </div>
    </Card>
  );
}

function DeleteButton({ role }: { role: Role }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const remove = async () => {
    await deleteRole(role.id);
    await queryClient.invalidateQueries({ queryKey: ['roles'] });
    showToast('Role deleted', 'success');
  };

  return (
    <Button size="sm" variant="danger" onClick={() => void remove()}><Trash2 size={14} /> Delete</Button>
  );
}
