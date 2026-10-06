import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, EyeOff, Trash2, Link as LinkIcon, Save, X, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';
import {
  fetchTopicCategories,
  fetchTopics,
  createTopic,
  updateTopic,
  publishTopic,
  deleteTopic,
  fetchTopicVerses,
  addTopicVerse,
  removeTopicVerse,
  type Topic,
  type TopicCategory,
} from '@/services/topicsService';

export function TopicsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: categories = [] } = useQuery({ queryKey: ['topicCategories'], queryFn: fetchTopicCategories });
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['topics', search, categoryFilter],
    queryFn: () => fetchTopics({ search, categoryId: categoryFilter || undefined }),
  });

  const selected = topics.find((t) => t.id === selectedId);

  const publish = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => publishTopic(id, publish),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      setSelectedId(null);
      showToast('Topic deleted', 'success');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Topics</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create, edit, publish, and link Bible study topics to verses.</p>
        </div>
        <Button size="sm" onClick={() => { setSelectedId(null); setShowEditor(true); }}>
          <Plus size={14} /> New Topic
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
          <Search size={16} className="text-[var(--text-tertiary)]" />
          <Input placeholder="Search topics..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 bg-transparent p-0 focus:ring-0" />
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
        <TopicEditor
          topic={selected ?? null}
          categories={categories}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            void queryClient.invalidateQueries({ queryKey: ['topics'] });
            showToast('Topic saved', 'success');
          }}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading topics...</p>}
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className={cn('cursor-pointer p-4 transition-colors hover:border-[var(--accent)]', selectedId === topic.id && 'border-[var(--accent)] bg-[var(--accent-soft)]')}
              onClick={() => { setSelectedId(topic.id); setShowEditor(true); }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text-primary)]">{topic.title}</p>
                    <Badge variant={topic.published ? 'success' : 'default'}>{topic.published ? 'Published' : 'Draft'}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">{topic.summary}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); void publish.mutate({ id: topic.id, publish: !topic.published }); }}
                    className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-active)]"
                  >
                    {topic.published ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); void remove.mutate(topic.id); }}
                    className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {topic.category && (
                <span className="mt-2 inline-block rounded-md bg-[var(--bg-hover)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{topic.category.name}</span>
              )}
            </Card>
          ))}
        </div>

        <div>
          {selected && !showEditor ? (
            <TopicDetail topic={selected} />
          ) : (
            <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
              <BookOpen size={32} className="mb-3 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Select or create a topic to edit.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function TopicDetail({ topic }: { topic: Topic }) {
  const { data: verses = [] } = useQuery({ queryKey: ['topicVerses', topic.id], queryFn: () => fetchTopicVerses(topic.id) });

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-[var(--text-primary)]">{topic.title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{topic.content}</p>
      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--text-tertiary)]">Related Verses</h3>
        <div className="flex flex-wrap gap-2">
          {verses.length === 0 && <p className="text-xs text-[var(--text-tertiary)]">No verses linked.</p>}
          {verses.map((v) => (
            <span key={v.id} className="rounded-md bg-[var(--bg-hover)] px-2 py-1 text-xs text-[var(--text-primary)]">{v.book_id} {v.chapter}:{v.verse}</span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function TopicEditor({
  topic,
  categories,
  onClose,
  onSaved,
}: {
  topic: Topic | null;
  categories: TopicCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Topic>>({
    title: topic?.title ?? '',
    slug: topic?.slug ?? '',
    summary: topic?.summary ?? '',
    content: topic?.content ?? '',
    category_id: topic?.category_id ?? '',
    published: topic?.published ?? false,
  });
  const [verseInput, setVerseInput] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: verses = [] } = useQuery({
    queryKey: ['topicVerses', topic?.id],
    queryFn: () => fetchTopicVerses(topic!.id),
    enabled: !!topic?.id,
  });

  const save = async () => {
    try {
      if (!form.title?.trim() || !form.slug?.trim()) {
        showToast('Title and slug are required', 'error');
        return;
      }
      if (topic) {
        await updateTopic(topic.id, form);
      } else {
        await createTopic(form as Omit<Topic, 'id' | 'created_at' | 'updated_at'>);
      }
      onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  const addVerse = async () => {
    if (!topic || !verseInput.trim()) return;
    const [book, cv] = verseInput.trim().split(/\s+/);
    const [chapter, verse] = cv.split(':').map(Number);
    if (!book || isNaN(chapter) || isNaN(verse)) return;
    await addTopicVerse(topic.id, { book_id: book.toLowerCase(), chapter, verse });
    void queryClient.invalidateQueries({ queryKey: ['topicVerses', topic.id] });
    setVerseInput('');
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text-primary)]">{topic ? 'Edit Topic' : 'New Topic'}</h2>
        <button onClick={onClose} className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"><X size={18} /></button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Title" value={form.title ?? ''} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        <Input placeholder="Slug" value={form.slug ?? ''} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
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

      {topic && (
        <div className="mt-5">
          <div className="flex flex-col gap-2 sm:flex-row">
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
                <button onClick={() => { void removeTopicVerse(v.id).then(() => queryClient.invalidateQueries({ queryKey: ['topicVerses', topic.id] })); }} className="text-[var(--text-tertiary)] hover:text-red-500"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={() => void save()}><Save size={14} /> Save Topic</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </Card>
  );
}
