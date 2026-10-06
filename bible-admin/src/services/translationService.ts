import { supabase } from '@/services/supabaseClient';

export interface BibleTranslation {
  code: string;
  name: string;
  short_name: string;
  language: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BibleBook {
  id: string;
  book_key: string;
  name: string;
  testament: 'OT' | 'NT';
  chapter_count: number;
  created_at?: string;
}

export interface BibleVerse {
  id: string;
  book_id: string;
  chapter_id: string;
  translation: string;
  chapter_number: number;
  verse_number: number;
  text: string;
}

export async function fetchTranslations(): Promise<BibleTranslation[]> {
  const { data, error } = await supabase.from('bible_translations').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function toggleTranslation(code: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.from('bible_translations').update({ enabled }).eq('code', code);
  if (error) throw error;
}

export async function createTranslation(translation: Omit<BibleTranslation, 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase.from('bible_translations').insert(translation);
  if (error) throw error;
}

export async function deleteTranslation(code: string): Promise<void> {
  const { error } = await supabase.from('bible_translations').delete().eq('code', code);
  if (error) throw error;
}

export async function fetchBooks(): Promise<BibleBook[]> {
  const { data, error } = await supabase.from('bible_books').select('id, book_key, name, testament, chapters_count').order('book_order');
  if (error) throw error;
  return (data ?? []).map((b: { id: string; book_key: string; name: string; testament: 'OT' | 'NT'; chapters_count: number }) => ({
    id: b.id,
    book_key: b.book_key,
    name: b.name,
    testament: b.testament,
    chapter_count: b.chapters_count,
  }));
}

export async function searchVerses(query: string, translation?: string): Promise<BibleVerse[]> {
  let q = supabase.from('bible_verses').select('*').ilike('text', `%${query}%`).limit(50);
  if (translation) q = q.eq('translation', translation);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchVerseForComparison(chapter: number, verse: number, translations: string[]): Promise<Record<string, string>> {
  if (translations.length === 0) return {};
  const { data, error } = await supabase
    .from('bible_verses')
    .select('translation, text')
    .eq('chapter_number', chapter)
    .eq('verse_number', verse)
    .in('translation', translations);
  if (error) throw error;
  const result: Record<string, string> = {};
  for (const row of data ?? []) result[row.translation] = row.text;
  return result;
}

export async function upsertVerses(verses: Partial<BibleVerse>[]): Promise<void> {
  const { error } = await supabase.from('bible_verses').upsert(verses);
  if (error) throw error;
}

export async function importVersesFromJson(translation: string, json: unknown): Promise<{ inserted: number }> {
  // Expected shape: [{ book_key, chapter_number, verse_number, text }]
  const rows = Array.isArray(json) ? json : [];
  const payload = rows
    .filter((r: unknown) => (r as { book_key?: string }).book_key)
    .map((r: unknown) => {
      const row = r as { book_key: string; chapter_number: number; verse_number: number; text: string };
      return {
        translation,
        book_id: row.book_key,
        chapter_id: `${row.book_key}:${row.chapter_number}`,
        chapter_number: row.chapter_number,
        verse_number: row.verse_number,
        text: row.text,
      };
    });
  if (payload.length > 0) {
    const { error } = await supabase.from('bible_verses').upsert(payload);
    if (error) throw error;
  }
  return { inserted: payload.length };
}


