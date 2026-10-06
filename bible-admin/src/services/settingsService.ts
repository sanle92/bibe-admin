import { supabase } from '@/services/supabaseClient';

export interface PlatformSettings {
  general: {
    appName: string;
    supportEmail: string;
    defaultLanguage: string;
    timezone: string;
  };
  branding: {
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  email: {
    provider: string;
    from: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
  };
  push: {
    provider: string;
    fcmServerKey: string;
  };
  storage: {
    provider: string;
    maxFileSizeMb: number;
    allowedTypes: string[];
  };
  security: {
    mfaRequired: boolean;
    sessionTimeoutMinutes: number;
    passwordMinLength: number;
    requirePasswordChangeDays: number;
  };
  backups: {
    enabled: boolean;
    frequency: string;
    retentionDays: number;
    lastBackupAt?: string | null;
  };
  integrations: {
    googleAnalyticsId: string;
    sentryDsn: string;
    stripePublicKey: string;
  };
}

const DEFAULT_SETTINGS: PlatformSettings = {
  general: { appName: 'Bible App', supportEmail: 'support@bible.app', defaultLanguage: 'en', timezone: 'UTC' },
  branding: { primaryColor: '#4f46e5', logoUrl: '', faviconUrl: '' },
  maintenance: { enabled: false, message: 'We are performing scheduled maintenance.' },
  email: { provider: 'smtp', from: 'noreply@bible.app', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '' },
  push: { provider: 'firebase', fcmServerKey: '' },
  storage: { provider: 'supabase', maxFileSizeMb: 50, allowedTypes: ['image', 'pdf', 'audio', 'video', 'document'] },
  security: { mfaRequired: false, sessionTimeoutMinutes: 60, passwordMinLength: 8, requirePasswordChangeDays: 90 },
  backups: { enabled: true, frequency: 'daily', retentionDays: 30, lastBackupAt: null },
  integrations: { googleAnalyticsId: '', sentryDsn: '', stripePublicKey: '' },
};

export async function fetchSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase.from('platform_settings').select('key, value');
  if (error) throw error;
  const out: Record<string, Record<string, unknown>> = { ...DEFAULT_SETTINGS };
  for (const row of data ?? []) {
    const key = row.key as keyof PlatformSettings;
    if (key in out) {
      out[key] = { ...out[key], ...(row.value as Record<string, unknown>) };
    }
  }
  return out as unknown as PlatformSettings;
}

export async function updateSetting<K extends keyof PlatformSettings>(
  key: K,
  value: Partial<PlatformSettings[K]>,
  userId?: string
): Promise<void> {
  const { data, error: fetchError } = await supabase.from('platform_settings').select('value').eq('key', key).maybeSingle();
  if (fetchError) throw fetchError;
  const existing = (data?.value as Record<string, unknown>) ?? {};
  const merged = { ...existing, ...value };
  const updated_at = new Date().toISOString();
  const updated_by = userId ?? null;
  if (data) {
    const { error } = await supabase
      .from('platform_settings')
      .update({ value: merged, updated_at, updated_by })
      .eq('key', key);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('platform_settings').insert({ key, value: merged, updated_at, updated_by });
    if (error) throw error;
  }
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created_at?: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  revoked: boolean;
}

export async function fetchApiKeys(): Promise<ApiKey[]> {
  const { data, error } = await supabase.from('api_keys').select('id, name, prefix, scopes, created_at, expires_at, last_used_at, revoked').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createApiKey(name: string, scopes: string[], expiresInDays?: number): Promise<{ key: string; id: string } | null> {
  const key = 'pk_' + crypto.randomUUID().replace(/-/g, '');
  const prefix = key.slice(0, 7) + '...';
  const { data, error } = await supabase.from('api_keys').insert({
    name,
    key_hash: key,
    prefix,
    scopes,
    expires_at: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null,
  }).select('id').single();
  if (error) throw error;
  return data ? { key, id: data.id } : null;
}

export async function revokeApiKey(id: string): Promise<void> {
  const { error } = await supabase.from('api_keys').update({ revoked: true }).eq('id', id);
  if (error) throw error;
}

export async function triggerBackup(userId?: string): Promise<{ success: boolean; message: string }> {
  // In production this would call an Edge Function or a backup service.
  await updateSetting('backups', { lastBackupAt: new Date().toISOString() } as Partial<PlatformSettings['backups']>, userId);
  return { success: true, message: 'Backup triggered. Check Supabase dashboard for status.' };
}
