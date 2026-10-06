import { supabase } from '@/services/supabaseClient';

export type NotificationType = 'push' | 'email' | 'in_app';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string;
  body: string;
  data?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: 'all' | 'users' | 'admins';
  published: boolean;
  published_at?: string | null;
  created_at?: string;
}

export interface NotificationSchedule {
  id: string;
  template_id?: string | null;
  type: NotificationType;
  audience: 'all' | 'users' | 'admins';
  scheduled_at: string;
  sent: boolean;
  sent_at?: string | null;
  created_at?: string;
  template?: NotificationTemplate;
}

export interface NotificationHistory {
  id: string;
  user_id?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: string | null;
  created_at?: string;
}

export async function fetchTemplates(): Promise<NotificationTemplate[]> {
  const { data, error } = await supabase.from('notification_templates').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase.from('notification_templates').insert(template);
  if (error) throw error;
}

export async function updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<void> {
  const { error } = await supabase.from('notification_templates').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('notification_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'published_at' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase.from('announcements').insert(announcement);
  if (error) throw error;
}

export async function publishAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').update({ published: true, published_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchSchedules(): Promise<NotificationSchedule[]> {
  const { data, error } = await supabase.from('notification_schedules').select('*, template:notification_templates(*)').order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSchedule(schedule: Omit<NotificationSchedule, 'id' | 'sent' | 'sent_at' | 'created_at' | 'template'>): Promise<void> {
  const { error } = await supabase.from('notification_schedules').insert(schedule);
  if (error) throw error;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('notification_schedules').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchHistory(): Promise<NotificationHistory[]> {
  const { data, error } = await supabase.from('notification_history').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function sendNotification(payload: { type: NotificationType; title: string; body: string; audience: 'all' | 'users' | 'admins' }): Promise<void> {
  // In production this would call an Edge Function or queue.
  const { error } = await supabase.from('notification_history').insert({
    type: payload.type,
    title: payload.title,
    body: payload.body,
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
  if (error) throw error;
}




