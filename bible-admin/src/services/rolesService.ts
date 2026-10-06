import { supabase } from '@/services/supabaseClient';

export interface Role {
  id: string;
  key: string;
  name: string;
  description?: string;
  is_system: boolean;
  is_custom: boolean;
  permissions: string[];
  created_at?: string;
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  category: string;
  description?: string;
}

export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase.from('roles').select('*, role_permissions(permissions(key))').order('name');
  if (error) throw error;
  return (data ?? []).map((r: unknown) => {
    const role = r as Role & { role_permissions: { permissions: { key: string } }[] };
    return {
      ...role,
      permissions: role.role_permissions.map((rp) => rp.permissions.key),
    };
  });
}

export async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase.from('permissions').select('*').order('category').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createRole(role: Omit<Role, 'id' | 'created_at' | 'permissions'> & { permissions?: string[] }): Promise<void> {
  const { data, error } = await supabase.from('roles').insert({ key: role.key, name: role.name, description: role.description, is_system: false, is_custom: true }).select().single();
  if (error) throw error;
  if (role.permissions && role.permissions.length > 0 && data) {
    await setRolePermissions(data.id, role.permissions);
  }
}

export async function updateRole(id: string, updates: Partial<Role>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  const { error } = await supabase.from('roles').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) throw error;
}

export async function setRolePermissions(roleId: string, permissionKeys: string[]): Promise<void> {
  const { data: perms } = await supabase.from('permissions').select('id, key').in('key', permissionKeys);
  const mapping = (perms ?? []).map((p: { id: string }) => ({ role_id: roleId, permission_id: p.id }));
  await supabase.from('role_permissions').delete().eq('role_id', roleId);
  if (mapping.length > 0) {
    const { error } = await supabase.from('role_permissions').insert(mapping);
    if (error) throw error;
  }
}


