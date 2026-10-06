import { supabase } from '@/services/supabaseClient';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'import'
  | 'export'
  | 'disable'
  | 'enable'
  | 'approve'
  | 'reject'
  | 'schedule'
  | 'send_notification';

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email?: string;
  action: AuditAction;
  target_type?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
}

export interface AuditFilters {
  action?: AuditAction;
  userId?: string;
  targetType?: string;
  search?: string;
  from?: string;
  to?: string;
}

export async function logAudit(entry: Omit<AuditLog, 'id' | 'created_at' | 'user_email'>): Promise<void> {
  const payload: Record<string, unknown> = { ...entry };
  delete payload.user_email;
  const { error } = await supabase.from('audit_logs').insert(payload);
  if (error) {
    // Fail silently to avoid breaking user flows; log to console in dev.
    console.error('Audit log failed', error);
  }
}

export async function fetchAuditLogs(options: AuditFilters = {}): Promise<AuditLog[]> {
  let q = supabase.from('audit_logs').select('*, users(email)').order('created_at', { ascending: false }).limit(200);

  if (options.action) q = q.eq('action', options.action);
  if (options.userId) q = q.eq('user_id', options.userId);
  if (options.targetType) q = q.eq('target_type', options.targetType);
  if (options.from) q = q.gte('created_at', new Date(options.from).toISOString());
  if (options.to) q = q.lte('created_at', new Date(options.to).toISOString());
  if (options.search?.trim()) {
    q = q.or(`target_name.ilike.%${options.search}%,users.email.ilike.%${options.search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((d: unknown) => {
    const log = d as AuditLog & { users?: { email?: string } };
    return { ...log, user_email: log.users?.email };
  });
}

export async function fetchAuditStats(): Promise<{ total: number; byAction: Record<string, number> }> {
  const { count: total } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true });
  const { data } = await supabase.rpc('audit_logs_by_action');
  return { total: total ?? 0, byAction: data ?? {} };
}

