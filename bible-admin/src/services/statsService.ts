import { supabase } from '@/services/supabaseClient';

export interface PlatformStats {
  activeUsersToday: number;
  readingSessions: number;
  notesCreated: number;
  highlights: number;
  prayerRequests: number;
  journalEntries: number;
  storageUsageMB: number;
  serverStatus: 'operational' | 'degraded' | 'down';
}

export interface RecentActivity {
  id: string;
  type: 'note' | 'sermon' | 'prayer' | 'journal' | 'highlight' | 'user';
  message: string;
  user?: string;
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const [notes, highlights, prayers, journals] = await Promise.all([
    supabase.from('notes').select('*', { count: 'exact', head: true }),
    supabase.from('highlights').select('*', { count: 'exact', head: true }),
    supabase.from('prayer_requests').select('*', { count: 'exact', head: true }),
    supabase.from('journal_entries').select('*', { count: 'exact', head: true }),
  ]);

  return {
    activeUsersToday: 0,
    readingSessions: 0,
    notesCreated: notes.count ?? 0,
    highlights: highlights.count ?? 0,
    prayerRequests: prayers.count ?? 0,
    journalEntries: journals.count ?? 0,
    storageUsageMB: 0,
    serverStatus: 'operational',
  };
}

export function getHourlyActivity(): { hour: string; users: number; sessions: number }[] {
  return [];
}
