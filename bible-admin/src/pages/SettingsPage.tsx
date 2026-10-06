import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Palette,
  Image as ImageIcon,
  Languages,
  AlertTriangle,
  Mail,
  Bell,
  HardDrive,
  Shield,
  Database,
  Key,
  Plug,
  Save,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  fetchSettings,
  updateSetting,
  fetchApiKeys,
  createApiKey,
  revokeApiKey,
  triggerBackup,
  type PlatformSettings,
} from '@/services/settingsService';

const SECTIONS = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'theme', label: 'Theme', icon: ImageIcon },
  { key: 'languages', label: 'Languages', icon: Languages },
  { key: 'maintenance', label: 'Maintenance', icon: AlertTriangle },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'push', label: 'Push', icon: Bell },
  { key: 'storage', label: 'Storage', icon: HardDrive },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'backups', label: 'Backups', icon: Database },
  { key: 'apiKeys', label: 'API Keys', icon: Key },
  { key: 'integrations', label: 'Integrations', icon: Plug },
] as const;

type Section = (typeof SECTIONS)[number]['key'];

export function SettingsPage() {
  const [active, setActive] = useState<Section>('general');
  const { data: settings, isLoading } = useQuery({ queryKey: ['platformSettings'], queryFn: fetchSettings });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Manage platform configuration, branding, integrations, and security."
      />
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="p-3">
          <div className="space-y-1">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    active === s.key ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  <Icon size={16} /> {s.label}
                </button>
              );
            })}
          </div>
        </Card>
        <div className="lg:col-span-3">
          {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading settings...</p>}
          {settings && (
            <>
              {active === 'general' && <GeneralSection settings={settings} />}
              {active === 'branding' && <BrandingSection settings={settings} />}
              {active === 'theme' && <ThemeSection />}
              {active === 'languages' && <LanguagesSection settings={settings} />}
              {active === 'maintenance' && <MaintenanceSection settings={settings} />}
              {active === 'email' && <EmailSection settings={settings} />}
              {active === 'push' && <PushSection settings={settings} />}
              {active === 'storage' && <StorageSection settings={settings} />}
              {active === 'security' && <SecuritySection settings={settings} />}
              {active === 'backups' && <BackupsSection settings={settings} />}
              {active === 'apiKeys' && <ApiKeysSection />}
              {active === 'integrations' && <IntegrationsSection settings={settings} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function useSettingMutations<K extends keyof PlatformSettings>(key: K) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const [isSaving, setIsSaving] = useState(false);
  return {
    isSaving,
    save: async (value: Partial<PlatformSettings[K]>) => {
      setIsSaving(true);
      try {
        await updateSetting(key, value, userId);
        await queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
        showToast('Settings saved', 'success');
      } finally {
        setIsSaving(false);
      }
    },
  };
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </Card>
  );
}

function GeneralSection({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState(settings.general);
  const { save, isSaving } = useSettingMutations('general');
  return (
    <SectionCard title="General">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="App Name"><Input value={form.appName} onChange={(e) => setForm((s) => ({ ...s, appName: e.target.value }))} /></Field>
        <Field label="Support Email"><Input type="email" value={form.supportEmail} onChange={(e) => setForm((s) => ({ ...s, supportEmail: e.target.value }))} /></Field>
        <Field label="Default Language"><Input value={form.defaultLanguage} onChange={(e) => setForm((s) => ({ ...s, defaultLanguage: e.target.value }))} /></Field>
        <Field label="Timezone"><Input value={form.timezone} onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))} /></Field>
      </div>
      <Button className="mt-4" onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
    </SectionCard>
  );
}

function BrandingSection({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState(settings.branding);
  const { save, isSaving } = useSettingMutations('branding');
  return (
    <SectionCard title="Branding">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Primary Color"><Input type="color" value={form.primaryColor} onChange={(e) => setForm((s) => ({ ...s, primaryColor: e.target.value }))} className="h-10" /></Field>
        <Field label="Logo URL"><Input value={form.logoUrl} onChange={(e) => setForm((s) => ({ ...s, logoUrl: e.target.value }))} placeholder="https://..." /></Field>
        <Field label="Favicon URL"><Input value={form.faviconUrl} onChange={(e) => setForm((s) => ({ ...s, faviconUrl: e.target.value }))} placeholder="https://..." /></Field>
      </div>
      <Button className="mt-4" onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
    </SectionCard>
  );
}

function ThemeSection() {
  const { theme, setTheme, resolved } = useThemeStore();
  return (
    <SectionCard title="Theme">
      <div className="grid gap-3 sm:grid-cols-3">
        {(['light', 'dark', 'system'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              'rounded-xl border px-4 py-3 text-left capitalize transition-colors',
              theme === t ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]'
            )}
          >
            <span className="font-medium">{t}</span>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{t === 'light' ? 'Always light' : t === 'dark' ? 'Always dark' : 'Follow system'}</p>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--text-tertiary)]">Currently resolved to {resolved} mode.</p>
    </SectionCard>
  );
}

function LanguagesSection({ settings }: { settings: PlatformSettings }) {
  const { save, isSaving } = useSettingMutations('general');
  return (
    <SectionCard title="Languages">
      <p className="mb-3 text-sm text-[var(--text-secondary)]">Default language used for emails, notifications, and the public app.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Default Language">
          <select
            value={settings.general.defaultLanguage}
            onChange={(e) => void save({ defaultLanguage: e.target.value })}
            disabled={isSaving}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-50"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="sw">Swahili</option>
            <option value="ar">Arabic</option>
          </select>
        </Field>
      </div>
    </SectionCard>
  );
}

function MaintenanceSection({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState(settings.maintenance);
  const { save, isSaving } = useSettingMutations('maintenance');
  return (
    <SectionCard title="Maintenance Mode">
      <div className="mb-4 flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((s) => ({ ...s, enabled: e.target.checked }))} className="peer sr-only" />
          <div className="peer h-6 w-11 rounded-full bg-[var(--bg-hover)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-full" />
        </label>
        <span className="text-sm font-medium text-[var(--text-primary)]">{form.enabled ? 'Enabled' : 'Disabled'}</span>
      </div>
      <Field label="Maintenance Message">
        <textarea
          value={form.message}
          onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
          rows={3}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-3 text-sm text-[var(--text-primary)] outline-none"
        />
      </Field>
      <Button className="mt-4" onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
    </SectionCard>
  );
}

function EmailSection({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState(settings.email);
  const { save, isSaving } = useSettingMutations('email');
  return (
    <SectionCard title="Email Settings">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Provider"><Input value={form.provider} onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value }))} /></Field>
        <Field label="From Address"><Input type="email" value={form.from} onChange={(e) => setForm((s) => ({ ...s, from: e.target.value }))} /></Field>
        <Field label="SMTP Host"><Input value={form.smtpHost} onChange={(e) => setForm((s) => ({ ...s, smtpHost: e.target.value }))} /></Field>
        <Field label="SMTP Port"><Input type="number" value={form.smtpPort} onChange={(e) => setForm((s) => ({ ...s, smtpPort: parseInt(e.target.value) || 0 }))} /></Field>
        <Field label="SMTP User"><Input value={form.smtpUser} onChange={(e) => setForm((s) => ({ ...s, smtpUser: e.target.value }))} /></Field>
        <Field label="SMTP Password"><Input type="password" value={form.smtpPassword} onChange={(e) => setForm((s) => ({ ...s, smtpPassword: e.target.value }))} /></Field>
      </div>
      <Button className="mt-4" onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
    </SectionCard>
  );
}

function PushSection({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState(settings.push);
  const { save, isSaving } = useSettingMutations('push');
  return (
    <SectionCard title="Push Notifications">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Provider"><Input value={form.provider} onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value }))} /></Field>
        <Field label="FCM Server Key"><Input type="password" value={form.fcmServerKey} onChange={(e) => setForm((s) => ({ ...s, fcmServerKey: e.target.value }))} /></Field>
      </div>
      <Button className="mt-4" onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
    </SectionCard>
  );
}

function StorageSection({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState(settings.storage);
  const { save, isSaving } = useSettingMutations('storage');
  const allowedTypes = ['image', 'pdf', 'audio', 'video', 'document'];
  return (
    <SectionCard title="Storage">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Provider"><Input value={form.provider} onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value }))} /></Field>
        <Field label="Max File Size (MB)"><Input type="number" value={form.maxFileSizeMb} onChange={(e) => setForm((s) => ({ ...s, maxFileSizeMb: parseInt(e.target.value) || 0 }))} /></Field>
      </div>
      <div className="mt-3">
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Allowed File Types</p>
        <div className="flex flex-wrap gap-3">
          {allowedTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={form.allowedTypes.includes(type)}
                onChange={(e) => setForm((s) => ({ ...s, allowedTypes: e.target.checked ? [...s.allowedTypes, type] : s.allowedTypes.filter((t) => t !== type) }))}
                className="rounded border-[var(--border-subtle)] text-[var(--accent)]"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>
      <Button className="mt-4" onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
    </SectionCard>
  );
}

function SecuritySection({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState(settings.security);
  const { save, isSaving } = useSettingMutations('security');
  return (
    <SectionCard title="Security">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="MFA Required">
          <select value={form.mfaRequired ? 'yes' : 'no'} onChange={(e) => setForm((s) => ({ ...s, mfaRequired: e.target.value === 'yes' }))} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
        <Field label="Session Timeout (min)"><Input type="number" value={form.sessionTimeoutMinutes} onChange={(e) => setForm((s) => ({ ...s, sessionTimeoutMinutes: parseInt(e.target.value) || 0 }))} /></Field>
        <Field label="Min Password Length"><Input type="number" value={form.passwordMinLength} onChange={(e) => setForm((s) => ({ ...s, passwordMinLength: parseInt(e.target.value) || 0 }))} /></Field>
        <Field label="Password Change (days)"><Input type="number" value={form.requirePasswordChangeDays} onChange={(e) => setForm((s) => ({ ...s, requirePasswordChangeDays: parseInt(e.target.value) || 0 }))} /></Field>
      </div>
      <Button className="mt-4" onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
    </SectionCard>
  );
}

function BackupsSection({ settings }: { settings: PlatformSettings }) {
  const { showToast } = useToast();
  const [running, setRunning] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);
  const trigger = async () => {
    setRunning(true);
    const result = await triggerBackup(userId);
    setRunning(false);
    showToast(result.message, result.success ? 'success' : 'error');
  };
  const [form, setForm] = useState(settings.backups);
  const { save, isSaving } = useSettingMutations('backups');
  return (
    <SectionCard title="Backups">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Enabled">
          <select value={form.enabled ? 'yes' : 'no'} onChange={(e) => setForm((s) => ({ ...s, enabled: e.target.value === 'yes' }))} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Frequency">
          <select value={form.frequency} onChange={(e) => setForm((s) => ({ ...s, frequency: e.target.value }))} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </Field>
        <Field label="Retention (days)"><Input type="number" value={form.retentionDays} onChange={(e) => setForm((s) => ({ ...s, retentionDays: parseInt(e.target.value) || 0 }))} /></Field>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
        <Button variant="secondary" onClick={() => void trigger()} disabled={running}><Database size={14} /> {running ? 'Running...' : 'Trigger Backup'}</Button>
      </div>
      {form.lastBackupAt && <p className="mt-2 text-xs text-[var(--text-tertiary)]">Last backup: {form.lastBackupAt}</p>}
    </SectionCard>
  );
}

function ApiKeysSection() {
  const { data: keys = [], isLoading } = useQuery({ queryKey: ['apiKeys'], queryFn: fetchApiKeys });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read']);
  const [isCreating, setIsCreating] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const result = await createApiKey(name, scopes);
      if (result) {
        setNewKey(result.key);
        setName('');
        setScopes(['read']);
        await queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
        showToast('API key created', 'success');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const revoke = async (id: string) => {
    await revokeApiKey(id);
    await queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    showToast('API key revoked', 'success');
  };

  const copy = () => {
    void navigator.clipboard.writeText(newKey);
    showToast('Copied to clipboard', 'success');
  };

  const scopeOptions = ['read', 'write', 'admin'];
  const toggleScope = (scope: string) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  };

  return (
    <SectionCard title="API Keys">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Key name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          {scopeOptions.map((scope) => (
            <label key={scope} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={scopes.includes(scope)}
                onChange={() => toggleScope(scope)}
                className="rounded border-[var(--border-subtle)] text-[var(--accent)]"
              />
              <span className="capitalize">{scope}</span>
            </label>
          ))}
        </div>
        <Button onClick={() => void create()} disabled={isCreating || !name.trim() || scopes.length === 0}><Plus size={14} /> {isCreating ? 'Creating...' : 'Create'}</Button>
      </div>
      {newKey && (
        <div className="mb-4 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] p-3">
          <p className="text-xs text-[var(--accent)]">Copy this key now — it will not be shown again.</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 break-all text-sm text-[var(--text-primary)]">{newKey}</code>
            <button onClick={copy} className="text-[var(--accent)]"><Copy size={16} /></button>
          </div>
        </div>
      )}
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading...</p>}
      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{k.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{k.prefix} · {k.scopes.join(', ')} · {k.revoked ? 'Revoked' : 'Active'}</p>
            </div>
            {!k.revoked && <Button size="sm" variant="danger" onClick={() => void revoke(k.id)}><Trash2 size={14} /> Revoke</Button>}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function IntegrationsSection({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState(settings.integrations);
  const { save, isSaving } = useSettingMutations('integrations');
  return (
    <SectionCard title="Integrations">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Google Analytics ID"><Input value={form.googleAnalyticsId} onChange={(e) => setForm((s) => ({ ...s, googleAnalyticsId: e.target.value }))} /></Field>
        <Field label="Sentry DSN"><Input value={form.sentryDsn} onChange={(e) => setForm((s) => ({ ...s, sentryDsn: e.target.value }))} /></Field>
        <Field label="Stripe Public Key"><Input value={form.stripePublicKey} onChange={(e) => setForm((s) => ({ ...s, stripePublicKey: e.target.value }))} /></Field>
      </div>
      <Button className="mt-4" onClick={() => void save(form)} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</Button>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      {children}
    </div>
  );
}
