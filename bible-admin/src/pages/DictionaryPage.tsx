import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search, Plus, Eye, EyeOff, Trash2, Image as ImageIcon, Link as LinkIcon, Save, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import {
  fetchCategories,
  fetchEntries,
  createEntry,
  updateEntry,
  publishEntry,
  deleteEntry,
  fetchEntryVerses,
  addEntryVerse,
  removeEntryVerse,
  fetchEntryImages,
  addEntryImage,
  removeEntryImage,
  type DictionaryEntry,
  type DictionaryCategory,
} from '@/services/dictionaryService';

export function DictionaryPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: categories = [] } = useQuery({ queryKey: ['dictionaryCategories'], queryFn: fetchCategories });
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['dictionaryEntries', search, categoryFilter],
    queryFn: () => fetchEntries({ search, categoryId: categoryFilter || undefined }),
  });

  const selected = entries.find((e) => e.id === selectedEntryId);

  const publish = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => publishEntry(id, publish),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dictionaryEntries'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionaryEntries'] });
      setSelectedEntryId(null);
      showToast('Entry deleted', 'success');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dictionary</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage Bible dictionary entries, categories, references, images, and publishing.</p>
        </div>
        <Button size="sm" onClick={() => { setSelectedEntryId(null); setShowEditor(true); }}>
          <Plus size={14} /> New Entry
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
          <Search size={16} className="text-[var(--text-tertiary)]" />
          <Input placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 bg-transparent p-0 focus:ring-0" />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {showEditor && (
        <EntryEditor
          entry={selected ?? null}
          categories={categories}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            void queryClient.invalidateQueries({ queryKey: ['dictionaryEntries'] });
            showToast('Entry saved', 'success');
          }}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading entries...</p>}
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className={cn('cursor-pointer p-4 transition-colors hover:border-[var(--accent)]', selectedEntryId === entry.id && 'border-[var(--accent)] bg-[var(--accent-soft)]')}
              onClick={() => { setSelectedEntryId(entry.id); setShowEditor(true); }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text-primary)]">{entry.title}</p>
                    <Badge variant={entry.published ? 'success' : 'default'}>{entry.published ? 'Published' : 'Draft'}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">{entry.summary}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); void publish.mutate({ id: entry.id, publish: !entry.published }); }}
                    className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-active)]"
                  >
                    {entry.published ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); void remove.mutate(entry.id); }}
                    className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {entry.category && (
                <span className="mt-2 inline-block rounded-md bg-[var(--bg-hover)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{entry.category.name}</span>
              )}
            </Card>
          ))}
        </div>

        <div>
          {selected && !showEditor ? (
            <EntryDetail entry={selected} />
          ) : (
            <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
              <BookOpen size={32} className="mb-3 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Select or create an entry to edit details, references, and images.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryDetail({ entry }: { entry: DictionaryEntry }) {
  const { data: verses = [] } = useQuery({ queryKey: ['entryVerses', entry.id], queryFn: () => fetchEntryVerses(entry.id) });
  const { data: images = [] } = useQuery({ queryKey: ['entryImages', entry.id], queryFn: () => fetchEntryImages(entry.id) });

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-[var(--text-primary)]">{entry.title}</h2>
      {entry.pronunciation && <p className="text-xs text-[var(--text-tertiary)]">{entry.pronunciation}</p>}
      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{entry.content}</p>

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--text-tertiary)]">Related Verses</h3>
        <div className="flex flex-wrap gap-2">
          {verses.length === 0 && <p className="text-xs text-[var(--text-tertiary)]">No verses linked.</p>}
          {verses.map((v) => (
            <span key={v.id} className="rounded-md bg-[var(--bg-hover)] px-2 py-1 text-xs text-[var(--text-primary)]">{v.book_id} {v.chapter}:{v.verse}</span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--text-tertiary)]">Images</h3>
        <div className="grid grid-cols-2 gap-2">
          {images.length === 0 && <p className="text-xs text-[var(--text-tertiary)]">No images.</p>}
          {images.map((img) => (
            <div key={img.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-2">
              <div className="aspect-video rounded-md bg-[var(--bg-active)]" />
              {img.caption && <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{img.caption}</p>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function EntryEditor({
  entry,
  categories,
  onClose,
  onSaved,
}: {
  entry: DictionaryEntry | null;
  categories: DictionaryCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<DictionaryEntry>>({
    title: entry?.title ?? '',
    slug: entry?.slug ?? '',
    summary: entry?.summary ?? '',
    content: entry?.content ?? '',
    category_id: entry?.category_id ?? '',
    pronunciation: entry?.pronunciation ?? '',
    published: entry?.published ?? false,
  });
  const [verseInput, setVerseInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: verses = [] } = useQuery({
    queryKey: ['entryVerses', entry?.id],
    queryFn: () => fetchEntryVerses(entry!.id),
    enabled: !!entry?.id,
  });

  const { data: images = [] } = useQuery({
    queryKey: ['entryImages', entry?.id],
    queryFn: () => fetchEntryImages(entry!.id),
    enabled: !!entry?.id,
  });

  const save = async () => {
    try {
      if (!form.title?.trim() || !form.slug?.trim()) {
        showToast('Title and slug are required', 'error');
        return;
      }
      if (entry) {
        await updateEntry(entry.id, form);
      } else {
        await createEntry(form as Omit<DictionaryEntry, 'id' | 'created_at' | 'updated_at'>);
      }
      onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  const addVerse = async () => {
    if (!entry || !verseInput.trim()) return;
    const [book, cv] = verseInput.trim().split(/\s+/);
    const [chapter, verse] = cv.split(':').map(Number);
    if (!book || isNaN(chapter) || isNaN(verse)) return;
    await addEntryVerse(entry.id, { book_id: book.toLowerCase(), chapter, verse });
    void queryClient.invalidateQueries({ queryKey: ['entryVerses', entry.id] });
    setVerseInput('');
  };

  const addImage = async () => {
    if (!entry || !imageUrl.trim()) return;
    await addEntryImage(entry.id, { url: imageUrl, caption: imageCaption, sort_order: images.length });
    void queryClient.invalidateQueries({ queryKey: ['entryImages', entry.id] });
    setImageUrl('');
    setImageCaption('');
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text-primary)]">{entry ? 'Edit Entry' : 'New Entry'}</h2>
        <button onClick={onClose} className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"><X size={18} /></button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Title" value={form.title ?? ''} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        <Input placeholder="Slug" value={form.slug ?? ''} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
        <Input placeholder="Pronunciation" value={form.pronunciation ?? ''} onChange={(e) => setForm((s) => ({ ...s, pronunciation: e.target.value }))} />
        <select
          value={form.category_id ?? ''}
          onChange={(e) => setForm((s) => ({ ...s, category_id: e.target.value || null }))}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <Input placeholder="Summary" value={form.summary ?? ''} onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))} className="mt-3" />
      <textarea
        value={form.content ?? ''}
        onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
        placeholder="Full content..."
        rows={6}
        className="mt-3 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      />

      {entry && (
        <>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
              <LinkIcon size={14} className="text-[var(--text-tertiary)]" />
              <Input
                placeholder="Book Chapter:Verse (e.g. John 3:16)"
                value={verseInput}
                onChange={(e) => setVerseInput(e.target.value)}
                className="border-0 bg-transparent p-0 focus:ring-0"
              />
            </div>
            <Button size="sm" onClick={() => void addVerse()}>Add Verse</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {verses.map((v) => (
              <span key={v.id} className="flex items-center gap-1 rounded-md bg-[var(--bg-hover)] px-2 py-1 text-xs text-[var(--text-primary)]">
                {v.book_id} {v.chapter}:{v.verse}
                <button onClick={() => { void removeEntryVerse(v.id).then(() => queryClient.invalidateQueries({ queryKey: ['entryVerses', entry.id] })); }} className="text-[var(--text-tertiary)] hover:text-red-500"><X size={12} /></button>
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
              <ImageIcon size={14} className="text-[var(--text-tertiary)]" />
              <Input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="border-0 bg-transparent p-0 focus:ring-0" />
            </div>
            <Input placeholder="Caption" value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} />
          </div>
          <Button size="sm" className="mt-2" onClick={() => void addImage()}><ImageIcon size={14} /> Add Image</Button>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-2">
                <div className="aspect-square rounded-md bg-[var(--bg-active)]" />
                <button
                  onClick={() => { void removeEntryImage(img.id).then(() => queryClient.invalidateQueries({ queryKey: ['entryImages', entry.id] })); }}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={() => void save()}><Save size={14} /> Save Entry</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </Card>
  );
}
