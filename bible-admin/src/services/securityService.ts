import { supabase } from '@/services/supabaseClient';

export interface Session {
  id: string;
  user_id?: string;
  device_name?: string;
  device_type?: string;
  ip_address?: string;
  started_at?: string;
  last_active_at?: string;
  revoked: boolean;
}

export interface LoginRecord {
  id: string;
  user_id?: string;
  ip_address?: string;
  status: 'success' | 'failed' | 'blocked';
  created_at?: string;
}

export interface RateLimit {
  id: string;
  key: string;
  window_seconds: number;
  max_requests: number;
}

export async function fetchSessions(): Promise<Session[]> {
  const { data, error } = await supabase.from('user_sessions').select('*').eq('revoked', false).order('last_active_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function revokeSession(id: string): Promise<void> {
  const { error } = await supabase.from('user_sessions').update({ revoked: true }).eq('id', id);
  if (error) throw error;
}

export async function fetchLoginHistory(): Promise<LoginRecord[]> {
  const { data, error } = await supabase.from('login_history').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function fetchRateLimits(): Promise<RateLimit[]> {
  const { data, error } = await supabase.from('rate_limits').select('*').order('key');
  if (error) throw error;
  return data ?? [];
}

export async function updateRateLimit(id: string, values: Partial<RateLimit>): Promise<void> {
  const { error } = await supabase.from('rate_limits').update(values).eq('id', id);
  if (error) throw error;
}



