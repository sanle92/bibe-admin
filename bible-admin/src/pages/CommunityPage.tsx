import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, FolderOpen, MessageSquare, Flag, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import {
  fetchCommunityStats,
  fetchPublicNotes,
  fetchSharedCollections,
  fetchComments,
  fetchReports,
  setNoteModeration,
  setCollectionModeration,
  setCommentModeration,
  setReportStatus,
} from '@/services/communityService';

const TABS = ['overview', 'notes', 'collections', 'comments', 'reports'] as const;
type Tab = (typeof TABS)[number];

export function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: stats } = useQuery({ queryKey: ['communityStats'], queryFn: fetchCommunityStats });

  const approve = async (type: 'note' | 'collection' | 'comment', id: string) => {
    if (type === 'note') await setNoteModeration(id, 'approved');
    if (type === 'collection') await setCollectionModeration(id, 'approved');
    if (type === 'comment') await setCommentModeration(id, 'approved');
    await invalidate(type);
    showToast('Approved', 'success');
  };

  const reject = async (type: 'note' | 'collection' | 'comment', id: string) => {
    if (type === 'note') await setNoteModeration(id, 'rejected');
    if (type === 'collection') await setCollectionModeration(id, 'rejected');
    if (type === 'comment') await setCommentModeration(id, 'rejected');
    await invalidate(type);
    showToast('Rejected', 'warning');
  };

  const resolveReport = async (id: string) => {
    await setReportStatus(id, 'resolved');
    await queryClient.invalidateQueries({ queryKey: ['reports'] });
    await queryClient.invalidateQueries({ queryKey: ['communityStats'] });
    showToast('Report resolved', 'success');
  };

  const invalidate = async (type: 'note' | 'collection' | 'comment') => {
    await queryClient.invalidateQueries({ queryKey: [type === 'note' ? 'publicNotes' : type === 'collection' ? 'sharedCollections' : 'comments'] });
    await queryClient.invalidateQueries({ queryKey: ['communityStats'] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Community</h1>
        <p className="text-sm text-[var(--text-secondary)]">Moderate public notes, shared collections, comments, and reports.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              activeTab === tab ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <Overview stats={stats} />}
      {activeTab === 'notes' && <NotesList onApprove={(id) => void approve('note', id)} onReject={(id) => void reject('note', id)} />}
      {activeTab === 'collections' && <CollectionsList onApprove={(id) => void approve('collection', id)} onReject={(id) => void reject('collection', id)} />}
      {activeTab === 'comments' && <CommentsList onApprove={(id) => void approve('comment', id)} onReject={(id) => void reject('comment', id)} />}
      {activeTab === 'reports' && <ReportsList onResolve={(id) => void resolveReport(id)} />}
    </div>
  );
}

function Overview({ stats }: { stats?: { pendingNotes: number; pendingCollections: number; pendingComments: number; openReports: number } }) {
  const cards = [
    { label: 'Pending Notes', value: stats?.pendingNotes ?? 0, icon: FileText, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Pending Collections', value: stats?.pendingCollections ?? 0, icon: FolderOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pending Comments', value: stats?.pendingComments ?? 0, icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Open Reports', value: stats?.openReports ?? 0, icon: Flag, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{c.value}</p>
              </div>
              <div className={cn('rounded-xl p-2.5', c.bg, c.color)}>
                <Icon size={20} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function NotesList({ onApprove, onReject }: { onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const { data: notes = [], isLoading } = useQuery({ queryKey: ['publicNotes'], queryFn: () => fetchPublicNotes('pending') });
  return (
    <ModerationList isLoading={isLoading} title="Public Notes" empty="No pending public notes.">
      {notes.map((n) => (
        <Card key={n.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{n.title ?? 'Untitled note'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{n.user_email} · {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-3">{n.content}</p>
            </div>
            <Badge variant={n.moderation_status === 'approved' ? 'success' : n.moderation_status === 'rejected' ? 'danger' : 'warning'} className="capitalize">
              {n.moderation_status}
            </Badge>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onApprove(n.id)}><CheckCircle size={14} /> Approve</Button>
            <Button size="sm" variant="danger" onClick={() => onReject(n.id)}><XCircle size={14} /> Reject</Button>
          </div>
        </Card>
      ))}
    </ModerationList>
  );
}

function CollectionsList({ onApprove, onReject }: { onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const { data: collections = [], isLoading } = useQuery({ queryKey: ['sharedCollections'], queryFn: () => fetchSharedCollections('pending') });
  return (
    <ModerationList isLoading={isLoading} title="Shared Collections" empty="No pending shared collections.">
      {collections.map((c) => (
        <Card key={c.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{c.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{c.user_email} · {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{c.description}</p>
            </div>
            <Badge variant="warning" className="capitalize">{c.moderation_status}</Badge>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onApprove(c.id)}><CheckCircle size={14} /> Approve</Button>
            <Button size="sm" variant="danger" onClick={() => onReject(c.id)}><XCircle size={14} /> Reject</Button>
          </div>
        </Card>
      ))}
    </ModerationList>
  );
}

function CommentsList({ onApprove, onReject }: { onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const { data: comments = [], isLoading } = useQuery({ queryKey: ['comments'], queryFn: () => fetchComments('pending') });
  return (
    <ModerationList isLoading={isLoading} title="Comments" empty="No pending comments.">
      {comments.map((c) => (
        <Card key={c.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--text-primary)]">{c.content}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{c.user_email} · on {c.target_type} {c.target_id.slice(0, 6)}</p>
            </div>
            <Badge variant="warning" className="capitalize">{c.moderation_status}</Badge>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onApprove(c.id)}><CheckCircle size={14} /> Approve</Button>
            <Button size="sm" variant="danger" onClick={() => onReject(c.id)}><XCircle size={14} /> Reject</Button>
          </div>
        </Card>
      ))}
    </ModerationList>
  );
}

function ReportsList({ onResolve }: { onResolve: (id: string) => void }) {
  const { data: reports = [], isLoading } = useQuery({ queryKey: ['reports'], queryFn: () => fetchReports('open') });
  return (
    <ModerationList isLoading={isLoading} title="Reports" empty="No open reports.">
      {reports.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <AlertCircle size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--text-primary)]">{r.reason}</p>
                <Badge variant="danger" className="capitalize">{r.status}</Badge>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">Reporter: {r.reporter_email ?? 'Anonymous'} · Target: {r.target_type} {r.target_id.slice(0, 6)}</p>
              {r.details && <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.details}</p>}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onResolve(r.id)}><CheckCircle size={14} /> Resolve</Button>
          </div>
        </Card>
      ))}
    </ModerationList>
  );
}

function ModerationList({
  isLoading,
  title,
  empty,
  children,
}: {
  isLoading: boolean;
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold text-[var(--text-primary)]">{title}</h2>
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading...</p>}
      {!isLoading && items.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">{empty}</p>}
      <div className="space-y-3">{children}</div>
    </Card>
  );
}
