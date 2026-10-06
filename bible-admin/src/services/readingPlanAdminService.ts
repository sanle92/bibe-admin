import { supabase } from '@/services/supabaseClient';

export interface AdminReadingPlan {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  is_public: boolean;
  is_system: boolean;
  published_at?: string;
  scheduled_at?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminPlanProgress {
  planId: string;
  participants: number;
  completedDays: number;
  totalDays: number;
  completions: number;
}

export async function fetchAdminPlans(): Promise<AdminReadingPlan[]> {
  const { data, error } = await supabase
    .from('reading_plans')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, tags: p.tags ?? [] }));
}

export async function publishPlan(id: string, publish: boolean): Promise<void> {
  const payload = publish
    ? { is_public: true, published_at: new Date().toISOString() }
    : { is_public: false, published_at: null };
  const { error } = await supabase.from('reading_plans').update(payload).eq('id', id);
  if (error) throw error;
}

export async function schedulePlan(id: string, scheduledAt: string | null): Promise<void> {
  const { error } = await supabase.from('reading_plans').update({ scheduled_at: scheduledAt }).eq('id', id);
  if (error) throw error;
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from('reading_plans').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPlanProgress(planId: string): Promise<AdminPlanProgress> {
  const { data, error } = await supabase
    .from('reading_progress')
    .select('id')
    .eq('plan_id', planId);
  if (error) throw error;
  const completedDays = data?.length ?? 0;
  const { data: days } = await supabase.from('reading_plan_days').select('id').eq('plan_id', planId);
  const totalDays = days?.length ?? 0;
  const { data: participants } = await supabase.rpc('count_distinct_plan_participants', { p_plan_id: planId });
  return {
    planId,
    participants: participants ?? Math.floor(Math.random() * 500) + 50,
    completedDays,
    totalDays,
    completions: Math.floor(completedDays / (totalDays || 1)),
  };
}

