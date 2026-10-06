import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, Megaphone, Calendar, FileText, History, Send, CheckCircle, Trash2, Plus, X, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow, format } from 'date-fns';
import {
  fetchTemplates,
  fetchAnnouncements,
  fetchSchedules,
  fetchHistory,
  sendNotification,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
  createSchedule,
  deleteSchedule,
  type NotificationType,
  type NotificationTemplate,
} from '@/services/notificationsAdminService';

const TABS = ['send', 'templates', 'announcements', 'schedules', 'history'] as const;
type Tab = (typeof TABS)[number];

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('send');
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
    void queryClient.invalidateQueries({ queryKey: ['announcements'] });
    void queryClient.invalidateQueries({ queryKey: ['notificationSchedules'] });
    void queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
        <p className="text-sm text-[var(--text-secondary)]">Send push/email notifications, manage announcements, schedules, templates, and history.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              activeTab === tab ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {tab === 'send' && <Send size={14} />}
            {tab === 'templates' && <FileText size={14} />}
            {tab === 'announcements' && <Megaphone size={14} />}
            {tab === 'schedules' && <Calendar size={14} />}
            {tab === 'history' && <History size={14} />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'send' && <SendTab onSent={invalidate} />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'announcements' && <AnnouncementsTab />}
      {activeTab === 'schedules' && <SchedulesTab />}
      {activeTab === 'history' && <HistoryTab />}
    </div>
  );
}

function SendTab({ onSent }: { onSent: () => void }) {
  const [type, setType] = useState<NotificationType>('push');
  const [audience, setAudience] = useState<'all' | 'users' | 'admins'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { showToast } = useToast();

  const send = useMutation({
    mutationFn: () => sendNotification({ type, audience, title, body }),
    onSuccess: () => {
      setTitle('');
      setBody('');
      onSent();
      showToast('Notification sent', 'success');
    },
  });

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Send Notification</h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Type</label>
          <div className="flex rounded-lg border border-[var(--border-subtle)] p-1">
            {(['push', 'email', 'in_app'] as NotificationType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium capitalize',
                  type === t ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'
                )}
              >
                {t === 'push' && <Bell size={12} />}
                {t === 'email' && <Mail size={12} />}
                {t === 'in_app' && <Megaphone size={12} />}
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as 'all' | 'users' | 'admins')}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="all">All</option>
            <option value="users">Users</option>
            <option value="admins">Admins</option>
          </select>
        </div>
      </div>
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-3" />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message body..."
        rows={4}
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      />
      <div className="mt-4">
        <Button onClick={() => void send.mutate()}><Send size={14} /> Send Now</Button>
      </div>
    </Card>
  );
}

function TemplatesTab() {
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['notificationTemplates'], queryFn: fetchTemplates });
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const save = async (template: Partial<NotificationTemplate>) => {
    try {
      if (editing?.id) {
        await updateTemplate(editing.id, template);
      } else {
        await createTemplate(template as Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>);
      }
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
      showToast('Template saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  const remove = async (id: string) => {
    await deleteTemplate(id);
    await queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
    showToast('Template deleted', 'success');
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text-primary)]">Templates</h2>
        <Button size="sm" onClick={() => setEditing({ id: ' ', type: 'push', body: '' } as NotificationTemplate)}><Plus size={14} /> New</Button>
      </div>
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading...</p>}
      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-[var(--text-primary)]">{t.name}</p>
                <p className="text-xs text-[var(--text-tertiary)] capitalize">{t.type}{t.subject ? ` · ${t.subject}` : ''}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{t.body}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => void remove(t.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && <TemplateEditor template={editing} onSave={save} onClose={() => setEditing(null)} />}
    </Card>
  );
}

function TemplateEditor({ template, onSave, onClose }: { template: NotificationTemplate; onSave: (t: Partial<NotificationTemplate>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<NotificationTemplate>>({
    name: template.name,
    type: template.type,
    subject: template.subject,
    body: template.body,
  });

  return (
    <Card className="mt-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-[var(--text-primary)]">{template.id ? 'Edit Template' : 'New Template'}</h3>
        <button onClick={onClose}><X size={18} className="text-[var(--text-tertiary)]" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Name" value={form.name ?? ''} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        <select
          value={form.type ?? 'push'}
          onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as NotificationType }))}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="push">Push</option>
          <option value="email">Email</option>
          <option value="in_app">In-app</option>
        </select>
        <Input placeholder="Subject" value={form.subject ?? ''} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} />
      </div>
      <textarea
        value={form.body ?? ''}
        onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
        placeholder="Body..."
        rows={4}
        className="mt-3 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-3 text-sm text-[var(--text-primary)] outline-none"
      />
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => onSave(form)}><CheckCircle size={14} /> Save</Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </Card>
  );
}

function AnnouncementsTab() {
  const { data: announcements = [], isLoading } = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements });
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'all' | 'users' | 'admins'>('all');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const create = async () => {
    if (!title.trim() || !content.trim()) return;
    await createAnnouncement({ title, content, audience, published: false });
    setTitle('');
    setContent('');
    setShowForm(false);
    await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    showToast('Announcement created', 'success');
  };

  const publish = async (id: string) => {
    await publishAnnouncement(id);
    await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    showToast('Announcement published', 'success');
  };

  const remove = async (id: string) => {
    await deleteAnnouncement(id);
    await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    showToast('Announcement deleted', 'success');
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text-primary)]">Announcements</h2>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> New</Button>
      </div>
      {showForm && (
        <div className="mb-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2" />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Announcement content..."
            rows={3}
            className="mb-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-2 text-sm text-[var(--text-primary)] outline-none"
          />
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as 'all' | 'users' | 'admins')}
            className="mb-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="all">All</option>
            <option value="users">Users</option>
            <option value="admins">Admins</option>
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void create()}>Save Draft</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading...</p>}
      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-[var(--text-primary)]">{a.title}</p>
                <p className="text-xs text-[var(--text-tertiary)] capitalize">{a.audience} · {a.published ? 'Published' : 'Draft'}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{a.content}</p>
              </div>
              <Badge variant={a.published ? 'success' : 'warning'}>{a.published ? 'Live' : 'Draft'}</Badge>
            </div>
            <div className="mt-2 flex gap-2">
              {!a.published && <Button size="sm" onClick={() => void publish(a.id)}><Megaphone size={14} /> Publish</Button>}
              <Button size="sm" variant="danger" onClick={() => void remove(a.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SchedulesTab() {
  const { data: schedules = [], isLoading } = useQuery({ queryKey: ['notificationSchedules'], queryFn: fetchSchedules });
  const { data: templates = [] } = useQuery({ queryKey: ['notificationTemplates'], queryFn: fetchTemplates });
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<NotificationType>('push');
  const [templateId, setTemplateId] = useState('');
  const [audience, setAudience] = useState<'all' | 'users' | 'admins'>('all');
  const [scheduledAt, setScheduledAt] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const create = async () => {
    await createSchedule({ type, template_id: templateId || null, audience, scheduled_at: new Date(scheduledAt).toISOString() });
    setShowForm(false);
    await queryClient.invalidateQueries({ queryKey: ['notificationSchedules'] });
    showToast('Scheduled', 'success');
  };

  const remove = async (id: string) => {
    await deleteSchedule(id);
    await queryClient.invalidateQueries({ queryKey: ['notificationSchedules'] });
    showToast('Schedule deleted', 'success');
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text-primary)]">Scheduled Notifications</h2>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> Schedule</Button>
      </div>
      {showForm && (
        <div className="mb-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={type} onChange={(e) => setType(e.target.value as NotificationType)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
              <option value="push">Push</option>
              <option value="email">Email</option>
              <option value="in_app">In-app</option>
            </select>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
              <option value="">No template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select value={audience} onChange={(e) => setAudience(e.target.value as 'all' | 'users' | 'admins')} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]">
              <option value="all">All</option>
              <option value="users">Users</option>
              <option value="admins">Admins</option>
            </select>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void create()}><Clock size={14} /> Schedule</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading...</p>}
      <div className="space-y-3">
        {schedules.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div>
              <p className="font-medium text-[var(--text-primary)] capitalize">{s.type} · {s.audience}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{s.template?.name ?? 'Custom'} · {format(new Date(s.scheduled_at), 'MMM d, yyyy HH:mm')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={s.sent ? 'success' : 'warning'}>{s.sent ? 'Sent' : 'Pending'}</Badge>
              {!s.sent && <Button size="sm" variant="danger" onClick={() => void remove(s.id)}><Trash2 size={14} /></Button>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HistoryTab() {
  const { data: history = [], isLoading } = useQuery({ queryKey: ['notificationHistory'], queryFn: fetchHistory });

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold text-[var(--text-primary)]">History</h2>
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading...</p>}
      <div className="space-y-3">
        {history.map((h) => (
          <div key={h.id} className="flex items-start justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{h.title}</p>
              <p className="text-xs text-[var(--text-tertiary)] capitalize">{h.type} · {h.status}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{h.body}</p>
            </div>
            <span className="text-xs text-[var(--text-tertiary)]">{h.sent_at ? formatDistanceToNow(new Date(h.sent_at)) + ' ago' : 'Pending'}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
