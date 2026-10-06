import { supabase } from '@/services/supabaseClient';

export type UserRole = 'super' | 'admin' | 'moderator' | 'viewer';

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  roles: UserRole[];
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt: string;
  stats: UserStats;
  devices: UserDevice[];
}

export interface UserStats {
  notesCount: number;
  highlightsCount: number;
  journalCount: number;
  prayersCount: number;
  readingDays: number;
  activePlans: number;
}

export interface UserDevice {
  id: string;
  deviceName?: string;
  deviceType?: string;
  lastIp?: string;
  lastActiveAt?: string;
}

export async function fetchUsers(): Promise<AdminUser[]> {

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;

  const userIds = (usersData?.users ?? []).map((u) => u.id);
  if (userIds.length === 0) return [];

  const [{ data: roles }, { data: statuses }, { data: contentStats }, { data: readingStats }, { data: devices }] = await Promise.all([
    supabase.from('user_roles').select('*').in('user_id', userIds),
    supabase.from('user_status').select('*').in('user_id', userIds),
    supabase.from('user_content_stats').select('*').in('user_id', userIds),
    supabase.from('user_reading_stats').select('*').in('user_id', userIds),
    supabase.from('user_devices').select('*').in('user_id', userIds),
  ]);

  const rolesByUser = groupBy(roles ?? [], 'user_id');
  const statusByUser = keyBy(statuses ?? [], 'user_id');
  const contentByUser = keyBy(contentStats ?? [], 'user_id');
  const readingByUser = keyBy(readingStats ?? [], 'user_id');
  const devicesByUser = groupBy(devices ?? [], 'user_id');

  return (usersData?.users ?? []).map((u) => {
    const status = statusByUser[u.id];
    const content = contentByUser[u.id];
    const reading = readingByUser[u.id];
    return {
      id: u.id,
      email: u.email ?? '',
      displayName: u.user_metadata?.display_name ?? u.user_metadata?.name,
      avatarUrl: u.user_metadata?.avatar_url,
      roles: (rolesByUser[u.id] ?? []).map((r: { role: string }) => r.role as UserRole),
      status: status?.disabled ? 'disabled' : 'active',
      lastLoginAt: status?.last_login_at,
      createdAt: u.created_at,
      stats: {
        notesCount: content?.notes_count ?? 0,
        highlightsCount: content?.highlights_count ?? 0,
        journalCount: content?.journal_count ?? 0,
        prayersCount: content?.prayers_count ?? 0,
        readingDays: reading?.completed_days ?? 0,
        activePlans: reading?.active_plans ?? 0,
      },
      devices: (devicesByUser[u.id] ?? []).map((d: UserDevice) => d),
    };
  });
}

export async function setUserRole(userId: string, roles: UserRole[]): Promise<void> {
  await supabase.from('user_roles').delete().eq('user_id', userId);
  if (roles.length > 0) {
    const { error } = await supabase.from('user_roles').insert(roles.map((role) => ({ user_id: userId, role })));
    if (error) throw error;
  }
}

export async function setUserStatus(userId: string, disabled: boolean, adminUserId?: string): Promise<void> {
  const payload = disabled
    ? { disabled: true, disabled_at: new Date().toISOString(), disabled_by: adminUserId ?? null }
    : { disabled: false, disabled_at: null, disabled_by: null };
  const { error } = await supabase.from('user_status').upsert({ user_id: userId, ...payload });
  if (error) throw error;
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = acc[k] ?? [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function keyBy<T>(arr: T[], key: keyof T): Record<string, T> {
  return arr.reduce((acc, item) => {
    acc[String(item[key])] = item;
    return acc;
  }, {} as Record<string, T>);
}

