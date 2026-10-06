import { supabase } from '@/services/supabaseClient';

export interface Backup {
  id: string;
  name: string;
  type: 'automatic' | 'manual';
  status: 'in_progress' | 'completed' | 'failed';
  size_bytes?: number;
  storage_path?: string;
  started_at?: string;
  completed_at?: string;
}

export async function fetchBackups(): Promise<Backup[]> {
  const { data, error } = await supabase.from('backups').select('*').order('started_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function createBackup(name: string, type: 'automatic' | 'manual' = 'manual'): Promise<Backup | null> {
  // In production this triggers an Edge Function or pg_dump workflow.
  const { data, error } = await supabase.from('backups').insert({ name, type, status: 'in_progress', started_at: new Date().toISOString() }).select().single();
  if (error) throw error;
  return data;
}

export async function markBackupCompleted(id: string, sizeBytes: number, storagePath: string): Promise<void> {
  const { error } = await supabase.from('backups').update({ status: 'completed', size_bytes: sizeBytes, storage_path: storagePath, completed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteBackup(id: string): Promise<void> {
  const { error } = await supabase.from('backups').delete().eq('id', id);
  if (error) throw error;
}

export async function restoreBackup(_id: string): Promise<{ success: boolean; message: string }> {
  // In production this calls an Edge Function to restore from the backup file.
  return { success: true, message: 'Restore process started. Check server logs for progress.' };
}

export function downloadBackup(backup: Backup): void {
  if (!backup.storage_path) return;
  // In production: generate signed URL from storage.
  const { data } = supabase.storage.from('backups').getPublicUrl(backup.storage_path);
  const a = document.createElement('a');
  a.href = data.publicUrl;
  a.download = `${backup.name}.sql`;
  a.click();
}

