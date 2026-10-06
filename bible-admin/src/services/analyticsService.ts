import { supabase } from '@/services/supabaseClient';

export interface DauMau {
  day: string;
  dau: number;
  mau: number;
}

export interface RetentionCohort {
  cohort_day: string;
  cohort_size: number;
  d1_return: number;
  d7_return: number;
  d30_return: number;
}

export interface BreakdownItem {
  label: string;
  events?: number;
  users: number;
}

export interface PopularItem {
  label: string;
  reads?: number;
  readers: number;
}

export interface SearchTerm {
  query: string;
  searches: number;
  searchers: number;
}

export interface ReadingTime {
  day: string;
  seconds: number;
}

export async function fetchDauMau(days = 30): Promise<DauMau[]> {
  const { data, error } = await supabase.from('dau_mau').select('*').gte('day', new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)).order('day', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRetention(): Promise<RetentionCohort[]> {
  const { data, error } = await supabase.from('retention_cohorts').select('*').limit(12).order('cohort_day', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDeviceBreakdown(): Promise<BreakdownItem[]> {
  const { data, error } = await supabase.from('device_breakdown').select('*').order('users', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d: { device_type: string; users: number; events: number }) => ({ label: d.device_type ?? 'Unknown', users: d.users, events: d.events }));
}

export async function fetchCountryBreakdown(): Promise<BreakdownItem[]> {
  const { data, error } = await supabase.from('country_breakdown').select('*').order('users', { ascending: false }).limit(10);
  if (error) throw error;
  return (data ?? []).map((d: { country: string; users: number; events: number }) => ({ label: d.country ?? 'Unknown', users: d.users, events: d.events }));
}

export async function fetchPopularBooks(): Promise<PopularItem[]> {
  const { data, error } = await supabase.from('popular_books').select('*').limit(10).order('reads', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d: { book_id: string; reads: number; readers: number }) => ({ label: d.book_id, reads: d.reads, readers: d.readers }));
}

export async function fetchPopularChapters(): Promise<PopularItem[]> {
  const { data, error } = await supabase.from('popular_chapters').select('*').limit(10).order('reads', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d: { book_id: string; chapter_number: number; reads: number; readers: number }) => ({ label: `${d.book_id} ${d.chapter_number}`, reads: d.reads, readers: d.readers }));
}

export async function fetchPopularVerses(): Promise<PopularItem[]> {
  const { data, error } = await supabase.from('popular_verses').select('*').limit(10).order('views', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d: { reference: string; views: number; viewers: number }) => ({ label: d.reference, reads: d.views, readers: d.viewers }));
}

export async function fetchSearchAnalytics(): Promise<SearchTerm[]> {
  const { data, error } = await supabase.from('search_analytics').select('*').limit(10).order('searches', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReadingTime(days = 30): Promise<ReadingTime[]> {
  const { data, error } = await supabase.from('reading_time_daily').select('*').gte('day', new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)).order('day', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d: { day: string; seconds: number }) => ({ day: d.day, seconds: d.seconds ?? 0 }));
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}






