import { supabase } from '@/services/supabaseClient';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type TargetType = 'note' | 'comment' | 'collection' | 'user';

export interface PublicNote {
  id: string;
  title?: string;
  content?: string;
  user_email?: string;
  moderation_status: ModerationStatus;
  is_public: boolean;
  created_at?: string;
}

export interface SharedCollection {
  id: string;
  name: string;
  description?: string;
  user_email?: string;
  moderation_status: ModerationStatus;
  is_public: boolean;
  created_at?: string;
}

export interface Comment {
  id: string;
  target_type: 'note' | 'collection';
  target_id: string;
  content: string;
  user_email?: string;
  moderation_status: ModerationStatus;
  created_at?: string;
}

export interface Report {
  id: string;
  target_type: TargetType;
  target_id: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  reporter_email?: string;
  created_at?: string;
}

export interface CommunityStats {
  pendingNotes: number;
  pendingCollections: number;
  pendingComments: number;
  openReports: number;
}

export async function fetchCommunityStats(): Promise<CommunityStats> {
  const [{ count: pendingNotes }, { count: pendingCollections }, { count: pendingComments }, { count: openReports }] = await Promise.all([
    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('is_public', true).eq('moderation_status', 'pending'),
    supabase.from('shared_collections').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);
  return {
    pendingNotes: pendingNotes ?? 0,
    pendingCollections: pendingCollections ?? 0,
    pendingComments: pendingComments ?? 0,
    openReports: openReports ?? 0,
  };
}

export async function fetchPublicNotes(status?: ModerationStatus): Promise<PublicNote[]> {
  let q = supabase.from('notes').select('id, title, content, moderation_status, is_public, created_at, users(email)').eq('is_public', true);
  if (status) q = q.eq('moderation_status', status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((n: unknown) => {
    const note = n as { id: string; title?: string; content?: string; moderation_status: ModerationStatus; is_public: boolean; created_at?: string; users?: { email?: string } };
    return { ...note, user_email: note.users?.email };
  });
}

export async function setNoteModeration(id: string, status: ModerationStatus, adminId?: string): Promise<void> {
  const payload: Record<string, unknown> = { moderation_status: status };
  if (status === 'approved') {
    payload.approved_at = new Date().toISOString();
    payload.approved_by = adminId ?? null;
  }
  const { error } = await supabase.from('notes').update(payload).eq('id', id);
  if (error) throw error;
}

export async function fetchSharedCollections(status?: ModerationStatus): Promise<SharedCollection[]> {
  let q = supabase.from('shared_collections').select('*, users(email)');
  if (status) q = q.eq('moderation_status', status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c: unknown) => {
    const col = c as SharedCollection & { users?: { email?: string } };
    return { ...col, user_email: col.users?.email };
  });
}

export async function setCollectionModeration(id: string, status: ModerationStatus, adminId?: string): Promise<void> {
  const payload: Record<string, unknown> = { moderation_status: status };
  if (status === 'approved') {
    payload.approved_at = new Date().toISOString();
    payload.approved_by = adminId ?? null;
  }
  const { error } = await supabase.from('shared_collections').update(payload).eq('id', id);
  if (error) throw error;
}

export async function fetchComments(status?: ModerationStatus): Promise<Comment[]> {
  let q = supabase.from('comments').select('*, users(email)');
  if (status) q = q.eq('moderation_status', status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c: unknown) => {
    const com = c as Comment & { users?: { email?: string } };
    return { ...com, user_email: com.users?.email };
  });
}

export async function setCommentModeration(id: string, status: ModerationStatus): Promise<void> {
  const { error } = await supabase.from('comments').update({ moderation_status: status }).eq('id', id);
  if (error) throw error;
}

export async function fetchReports(status?: ReportStatus): Promise<Report[]> {
  let q = supabase.from('reports').select('*, users!reports_reporter_id_fkey(email)');
  if (status) q = q.eq('status', status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: unknown) => {
    const rep = r as Report & { users?: { email?: string } };
    return { ...rep, reporter_email: rep.users?.email };
  });
}

export async function setReportStatus(id: string, status: ReportStatus): Promise<void> {
  const { error } = await supabase.from('reports').update({ status }).eq('id', id);
  if (error) throw error;
}





