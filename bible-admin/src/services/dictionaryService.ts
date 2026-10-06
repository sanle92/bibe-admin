import { supabase } from '@/services/supabaseClient';

export interface DictionaryCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface DictionaryEntry {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category_id?: string | null;
  pronunciation?: string;
  published: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  category?: DictionaryCategory;
}

export interface DictionaryEntryVerse {
  id: string;
  entry_id: string;
  book_id: string;
  chapter: number;
  verse: number;
}

export interface DictionaryEntryImage {
  id: string;
  entry_id: string;
  url: string;
  caption?: string;
  sort_order: number;
}

export async function fetchCategories(): Promise<DictionaryCategory[]> {
  const { data, error } = await supabase.from('dictionary_categories').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchEntries(options?: { published?: boolean; categoryId?: string; search?: string }): Promise<DictionaryEntry[]> {
  let q = supabase.from('dictionary_entries').select('*, category:dictionary_categories(*)');
  if (options?.published !== undefined) q = q.eq('published', options.published);
  if (options?.categoryId) q = q.eq('category_id', options.categoryId);
  if (options?.search?.trim()) {
    q = q.or(`title.ilike.%${options.search}%,summary.ilike.%${options.search}%`);
  }
  const { data, error } = await q.order('title');
  if (error) throw error;
  return data ?? [];
}

export async function fetchEntry(id: string): Promise<DictionaryEntry | null> {
  const { data, error } = await supabase
    .from('dictionary_entries')
    .select('*, category:dictionary_categories(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ?? null;
}

export async function createEntry(entry: Omit<DictionaryEntry, 'id' | 'created_at' | 'updated_at'>): Promise<DictionaryEntry> {
  const { data, error } = await supabase.from('dictionary_entries').insert(entry).select().single();
  if (error) throw error;
  return data;
}

export async function updateEntry(id: string, updates: Partial<DictionaryEntry>): Promise<void> {
  const { error } = await supabase.from('dictionary_entries').update(updates).eq('id', id);
  if (error) throw error;
}

export async function publishEntry(id: string, publish: boolean): Promise<void> {
  const payload = publish ? { published: true, published_at: new Date().toISOString() } : { published: false, published_at: null };
  const { error } = await supabase.from('dictionary_entries').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('dictionary_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchEntryVerses(entryId: string): Promise<DictionaryEntryVerse[]> {
  const { data, error } = await supabase.from('dictionary_entry_verses').select('*').eq('entry_id', entryId).order('book_id');
  if (error) throw error;
  return data ?? [];
}

export async function addEntryVerse(entryId: string, ref: { book_id: string; chapter: number; verse: number }): Promise<void> {
  const { error } = await supabase.from('dictionary_entry_verses').insert({ entry_id: entryId, ...ref });
  if (error) throw error;
}

export async function removeEntryVerse(id: string): Promise<void> {
  const { error } = await supabase.from('dictionary_entry_verses').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchEntryImages(entryId: string): Promise<DictionaryEntryImage[]> {
  const { data, error } = await supabase.from('dictionary_entry_images').select('*').eq('entry_id', entryId).order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function addEntryImage(entryId: string, image: { url: string; caption?: string; sort_order?: number }): Promise<void> {
  const { error } = await supabase.from('dictionary_entry_images').insert({ entry_id: entryId, ...image });
  if (error) throw error;
}

export async function removeEntryImage(id: string): Promise<void> {
  const { error } = await supabase.from('dictionary_entry_images').delete().eq('id', id);
  if (error) throw error;
}


