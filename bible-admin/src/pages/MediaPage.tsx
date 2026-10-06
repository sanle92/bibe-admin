import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Image,
  FileText,
  Headphones,
  Video,
  Folder,
  Search,
  Upload,
  Plus,
  Trash2,
  HardDrive,
  Music,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from 'date-fns';
import { fetchStorageSummary, fetchFolders, fetchFiles, createFolder, uploadFile, deleteFile, formatBytes, type MediaType } from '@/services/mediaService';

const TYPE_OPTIONS: { key: MediaType | ''; label: string; icon: React.ElementType }[] = [
  { key: '', label: 'All', icon: Folder },
  { key: 'image', label: 'Images', icon: Image },
  { key: 'pdf', label: 'PDFs', icon: FileText },
  { key: 'audio', label: 'Audio', icon: Headphones },
  { key: 'document', label: 'Documents', icon: FileText },
  { key: 'video', label: 'Videos', icon: Video },
];

export function MediaPage() {
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<MediaType | ''>('');
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: summary } = useQuery({ queryKey: ['mediaStorageSummary'], queryFn: fetchStorageSummary });
  const { data: folders = [] } = useQuery({ queryKey: ['mediaFolders'], queryFn: fetchFolders });
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['mediaFiles', selectedFolder, typeFilter, search],
    queryFn: () => fetchFiles({ folderId: selectedFolder ?? undefined, type: typeFilter || undefined, search }),
  });

  const createFolderMutation = useMutation({
    mutationFn: () => createFolder(folderName, selectedFolder),
    onSuccess: () => {
      setFolderName('');
      setShowFolderForm(false);
      void queryClient.invalidateQueries({ queryKey: ['mediaFolders'] });
      showToast('Folder created', 'success');
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadFile(file, selectedFolder),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
      void queryClient.invalidateQueries({ queryKey: ['mediaStorageSummary'] });
      showToast('File uploaded', 'success');
    },
  });

  const remove = useMutation({
    mutationFn: (file: { id: string; storage_path: string }) => deleteFile(file.id, file.storage_path),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
      void queryClient.invalidateQueries({ queryKey: ['mediaStorageSummary'] });
      showToast('File deleted', 'success');
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void upload.mutate(f);
  };

  const usagePercent = summary && summary.total_bytes ? Math.min(100, (summary.total_bytes / (1024 * 1024 * 1024)) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Media Library</h1>
          <p className="text-sm text-[var(--text-secondary)]">Upload, organize, and manage images, PDFs, audio, documents, and videos.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowFolderForm(true)}><Plus size={14} /> Folder</Button>
          <Button size="sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload</Button>
        </div>
      </div>

      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <HardDrive size={20} />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Storage Usage</span>
              <span className="font-medium text-[var(--accent)]">{summary ? formatBytes(summary.total_bytes) : '0 B'} / 1 GB</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-hover)]">
              <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Stat label="Images" value={summary?.image_count ?? 0} icon={Image} />
          <Stat label="PDFs" value={summary?.pdf_count ?? 0} icon={FileText} />
          <Stat label="Audio" value={summary?.audio_count ?? 0} icon={Headphones} />
          <Stat label="Docs" value={summary?.document_count ?? 0} icon={FileText} />
          <Stat label="Videos" value={summary?.video_count ?? 0} icon={Video} />
          <Stat label="Total" value={summary?.file_count ?? 0} icon={Folder} />
        </div>
      </Card>

      {showFolderForm && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Input placeholder="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
            <Button size="sm" onClick={() => void createFolderMutation.mutate()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowFolderForm(false)}><X size={14} /></Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-3">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Folders</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                selectedFolder === null ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              )}
            >
              <Folder size={16} /> All Files
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  selectedFolder === f.id ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                <Folder size={16} /> {f.name}
              </button>
            ))}
          </div>

          <h3 className="mb-2 mt-4 text-sm font-semibold text-[var(--text-primary)]">Type</h3>
          <div className="space-y-1">
            {TYPE_OPTIONS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key as MediaType | '')}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors capitalize',
                    typeFilter === t.key ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
            <Search size={16} className="text-[var(--text-tertiary)]" />
            <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 bg-transparent p-0 focus:ring-0" />
          </div>

          {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading files...</p>}
          {!isLoading && files.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No files found.</p>}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => {
              const icon = TYPE_ICONS[file.type];
              const Icon = icon.icon;
              return (
                <div key={file.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
                  <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-[var(--bg-active)] text-[var(--text-tertiary)]">
                    {file.type === 'image' ? (
                      <img src={file.url} alt={file.name} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <Icon size={32} className={icon.color} />
                    )}
                  </div>
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{file.name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span>{formatBytes(file.size_bytes)}</span>
                    <span>{file.created_at ? formatDistanceToNow(new Date(file.created_at)) + ' ago' : ''}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="default" className="capitalize">{file.type}</Badge>
                    <button onClick={() => void remove.mutate({ id: file.id, storage_path: file.storage_path })} className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg bg-[var(--bg-hover)] p-2 text-center">
      <Icon size={16} className="mx-auto mb-1 text-[var(--text-tertiary)]" />
      <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
    </div>
  );
}

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  image: { icon: Image, color: 'text-violet-500' },
  pdf: { icon: FileText, color: 'text-red-500' },
  audio: { icon: Headphones, color: 'text-amber-500' },
  document: { icon: FileText, color: 'text-blue-500' },
  video: { icon: Video, color: 'text-emerald-500' },
  other: { icon: Music, color: 'text-[var(--text-tertiary)]' },
};
