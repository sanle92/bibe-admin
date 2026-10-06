import { supabase } from '@/services/supabaseClient';

export type MediaType = 'image' | 'pdf' | 'audio' | 'document' | 'video' | 'other';

export interface MediaFolder {
  id: string;
  name: string;
  parent_id?: string | null;
  created_at?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  size_bytes: number;
  url: string;
  storage_path: string;
  folder_id?: string | null;
  created_at?: string;
}

export interface StorageSummary {
  file_count: number;
  total_bytes: number;
  image_count: number;
  pdf_count: number;
  audio_count: number;
  document_count: number;
  video_count: number;
}

export async function fetchStorageSummary(): Promise<StorageSummary> {
  const { data, error } = await supabase.from('media_storage_summary').select('*').single();
  if (error) throw error;
  return data ?? { file_count: 0, total_bytes: 0, image_count: 0, pdf_count: 0, audio_count: 0, document_count: 0, video_count: 0 };
}

export async function fetchFolders(): Promise<MediaFolder[]> {
  const { data, error } = await supabase.from('media_folders').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createFolder(name: string, parentId?: string | null): Promise<void> {
  const { error } = await supabase.from('media_folders').insert({ name, parent_id: parentId ?? null });
  if (error) throw error;
}

export async function fetchFiles(options?: { folderId?: string; type?: MediaType; search?: string }): Promise<MediaFile[]> {
  let q = supabase.from('media_files').select('*');
  if (options?.folderId) q = q.eq('folder_id', options.folderId);
  if (options?.type) q = q.eq('type', options.type);
  if (options?.search?.trim()) q = q.ilike('name', `%${options.search}%`);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadFile(file: File, folderId?: string | null): Promise<MediaFile> {

  const path = `media/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path);
  const fileRecord: Omit<MediaFile, 'id' | 'created_at' | 'updated_at'> = {
    name: file.name,
    type: getMediaType(file.name),
    size_bytes: file.size,
    url: publicUrl.publicUrl,
    storage_path: path,
    folder_id: folderId ?? null,
  };
  const { data, error } = await supabase.from('media_files').insert(fileRecord).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFile(id: string, storagePath: string): Promise<void> {
  const { error } = await supabase.from('media_files').delete().eq('id', id);
  if (error) throw error;
  await supabase.storage.from('media').remove([storagePath]);
}

function getMediaType(name: string): MediaType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (['doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
  return 'other';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export { formatBytes };



