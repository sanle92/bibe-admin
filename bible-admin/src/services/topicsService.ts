import { supabase } from '@/services/supabaseClient';

export interface TopicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category_id?: string | null;
  published: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  category?: TopicCategory;
}

export interface TopicVerse {
  id: string;
  topic_id: string;
  book_id: string;
  chapter: number;
  verse: number;
}

export async function fetchTopicCategories(): Promise<TopicCategory[]> {
  const { data, error } = await supabase.from('topic_categories').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchTopics(options?: { published?: boolean; categoryId?: string; search?: string }): Promise<Topic[]> {
  let q = supabase.from('topics').select('*, category:topic_categories(*)');
  if (options?.published !== undefined) q = q.eq('published', options.published);
  if (options?.categoryId) q = q.eq('category_id', options.categoryId);
  if (options?.search?.trim()) {
    q = q.or(`title.ilike.%${options.search}%,summary.ilike.%${options.search}%`);
  }
  const { data, error } = await q.order('title');
  if (error) throw error;
  return data ?? [];
}

export async function createTopic(topic: Omit<Topic, 'id' | 'created_at' | 'updated_at'>): Promise<Topic> {
  const { data, error } = await supabase.from('topics').insert(topic).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopic(id: string, updates: Partial<Topic>): Promise<void> {
  const { error } = await supabase.from('topics').update(updates).eq('id', id);
  if (error) throw error;
}

export async function publishTopic(id: string, publish: boolean): Promise<void> {
  const payload = publish ? { published: true, published_at: new Date().toISOString() } : { published: false, published_at: null };
  const { error } = await supabase.from('topics').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchTopicVerses(topicId: string): Promise<TopicVerse[]> {
  const { data, error } = await supabase.from('topic_verses').select('*').eq('topic_id', topicId).order('book_id');
  if (error) throw error;
  return data ?? [];
}

export async function addTopicVerse(topicId: string, ref: { book_id: string; chapter: number; verse: number }): Promise<void> {
  const { error } = await supabase.from('topic_verses').insert({ topic_id: topicId, ...ref });
  if (error) throw error;
}

export async function removeTopicVerse(id: string): Promise<void> {
  const { error } = await supabase.from('topic_verses').delete().eq('id', id);
  if (error) throw error;
}


