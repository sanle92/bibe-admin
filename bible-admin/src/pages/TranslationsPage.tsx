import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search, Upload, Plus, Trash2, RefreshCw, FileJson, Database, GitCompare, X, Check, } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { fetchTranslations, toggleTranslation, createTranslation, deleteTranslation, fetchBooks, searchVerses, fetchVerseForComparison, importVersesFromJson, type BibleTranslation, type BibleBook } from '@/services/translationService';
import { useToast } from '@/hooks/useToast';

const TABS = ['translations', 'books', 'search', 'compare', 'import'] as const;
type Tab = (typeof TABS)[number];

export function TranslationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('translations');
  const { data: translations = [], isLoading } = useQuery({ queryKey: ['translations'], queryFn: fetchTranslations });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const toggle = useMutation({
    mutationFn: ({ code, enabled }: { code: string; enabled: boolean }) => toggleTranslation(code, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['translations'] }),
  });

  const remove = useMutation({
    mutationFn: (code: string) => deleteTranslation(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      showToast('Translation deleted', 'success');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bible Translations</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage translations, books, chapters, verses, and imports.</p>
        </div>
        <Button size="sm" onClick={() => setActiveTab('import')}>
          <Upload size={14} /> Import
        </Button>
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

      {activeTab === 'translations' && (
        <TranslationsList
          translations={translations}
          isLoading={isLoading}
          onToggle={(code, enabled) => void toggle.mutate({ code, enabled })}
          onDelete={(code) => void remove.mutate(code)}
        />
      )}
      {activeTab === 'books' && <BooksList />}
      {activeTab === 'search' && <SearchPanel translations={translations} />}
      {activeTab === 'compare' && <ComparePanel translations={translations} />}
      {activeTab === 'import' && <ImportPanel translations={translations} />}
    </div>
  );
}

function TranslationsList({
  translations,
  isLoading,
  onToggle,
  onDelete,
}: {
  translations: BibleTranslation[];
  isLoading: boolean;
  onToggle: (code: string, enabled: boolean) => void;
  onDelete: (code: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTranslation, setNewTranslation] = useState({ code: '', name: '', short_name: '', language: 'en' });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const add = useMutation({
    mutationFn: () => createTranslation({ ...newTranslation, enabled: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      setShowAdd(false);
      setNewTranslation({ code: '', name: '', short_name: '', language: 'en' });
      showToast('Translation added', 'success');
    },
  });

  if (isLoading) return <p className="text-sm text-[var(--text-secondary)]">Loading translations...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Translation
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-[var(--text-primary)]">New Translation</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Code (e.g. nkjv)" value={newTranslation.code} onChange={(e) => setNewTranslation((s) => ({ ...s, code: e.target.value }))} />
            <Input placeholder="Name" value={newTranslation.name} onChange={(e) => setNewTranslation((s) => ({ ...s, name: e.target.value }))} />
            <Input placeholder="Short name" value={newTranslation.short_name} onChange={(e) => setNewTranslation((s) => ({ ...s, short_name: e.target.value }))} />
            <Input placeholder="Language code" value={newTranslation.language} onChange={(e) => setNewTranslation((s) => ({ ...s, language: e.target.value }))} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void add.mutate()}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {translations.map((t) => (
          <Card key={t.code} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{t.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{t.code.toUpperCase()} · {t.language}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={t.enabled ? 'success' : 'default'}>{t.enabled ? 'Enabled' : 'Disabled'}</Badge>
              <button
                onClick={() => onToggle(t.code, !t.enabled)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  t.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg-hover)]'
                )}
              >
                <span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white transition-all', t.enabled ? 'left-6' : 'left-1')} />
              </button>
              <button onClick={() => onDelete(t.code)} className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BooksList() {
  const [search, setSearch] = useState('');
  const { data: books = [], isLoading } = useQuery({ queryKey: ['bibleBooks'], queryFn: fetchBooks });
  const filtered = books.filter((b: BibleBook) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
        <Search size={16} className="text-[var(--text-tertiary)]" />
        <Input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 bg-transparent p-0 focus:ring-0" />
      </div>
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading books...</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((book: BibleBook) => (
          <Card key={book.book_key} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{book.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{book.chapter_count} chapters · {book.testament}</p>
              </div>
              <button className="text-xs text-[var(--accent)] hover:underline">Edit</button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function SearchPanel({ translations }: { translations: BibleTranslation[] }) {
  const [query, setQuery] = useState('');
  const [translation, setTranslation] = useState('');
  const { data: verses = [], isLoading } = useQuery({
    queryKey: ['verseSearch', query, translation],
    queryFn: () => searchVerses(query, translation || undefined),
    enabled: query.trim().length > 2,
  });

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
          <Search size={16} className="text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search verses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent p-0 focus:ring-0"
          />
        </div>
        <select
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="">All translations</option>
          {translations.map((t) => (
            <option key={t.code} value={t.code}>{t.name}</option>
          ))}
        </select>
      </div>
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Searching...</p>}
      <div className="space-y-3">
        {verses.map((v) => (
          <div key={v.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="info">{v.translation}</Badge>
              <span className="text-xs text-[var(--text-tertiary)]">{v.book_id} {v.chapter_number}:{v.verse_number}</span>
            </div>
            <p className="text-sm text-[var(--text-primary)]">{v.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ComparePanel({ translations }: { translations: BibleTranslation[] }) {
  const [reference, setReference] = useState('John 3:16');
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>(['kjv', 'web']);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const parts = reference.trim().split(/\s+/);
    if (parts.length < 3) return;
    const cv = parts[parts.length - 1].split(':');
    const chapter = parseInt(cv[0], 10);
    const verse = parseInt(cv[1], 10);
    if (isNaN(chapter) || isNaN(verse)) return;
    setLoading(true);
    const data = await fetchVerseForComparison(chapter, verse, selectedTranslations);
    setResults(data);
    setLoading(false);
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Reference (e.g. John 3:16)" value={reference} onChange={(e) => setReference(e.target.value)} />
        <Button size="sm" onClick={() => void run()}><GitCompare size={14} /> Compare</Button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {translations.map((t) => {
          const selected = selectedTranslations.includes(t.code);
          return (
            <button
              key={t.code}
              onClick={() => setSelectedTranslations((prev) => (selected ? prev.filter((c) => c !== t.code) : [...prev, t.code]))}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                selected ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)]'
              )}
            >
              {selected && <Check size={12} className="mr-1 inline" />}
              {t.short_name || t.code}
            </button>
          );
        })}
      </div>
      {loading && <p className="text-sm text-[var(--text-secondary)]">Loading...</p>}
      <div className="space-y-3">
        {Object.entries(results).map(([code, text]) => (
          <div key={code} className="rounded-lg border border-[var(--border-subtle)] p-3">
            <Badge variant="info" className="mb-2">{code.toUpperCase()}</Badge>
            <p className="text-sm text-[var(--text-primary)]">{text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ImportPanel({ translations }: { translations: BibleTranslation[] }) {
  const [translation, setTranslation] = useState(translations[0]?.code ?? '');
  const [format, setFormat] = useState<'json' | 'sql'>('json');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (translations.length && !translation) setTranslation(translations[0].code);
  }, [translations, translation]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setContent(String(reader.result ?? ''));
    reader.readAsText(f);
  };

  const runImport = async () => {
    if (!content.trim()) return;
    try {
      if (format === 'json') {
        const json = JSON.parse(content);
        const { inserted } = await importVersesFromJson(translation, json);
        showToast(`Imported ${inserted} verses`, 'success');
      } else {
        // SQL import would normally be handled server-side.
        showToast('SQL import requires backend processing', 'warning');
      }
      queryClient.invalidateQueries({ queryKey: ['verseSearch'] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Import failed', 'error');
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Translation</label>
          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            {translations.map((t) => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Format</label>
          <div className="flex rounded-lg border border-[var(--border-subtle)] p-1">
            <button
              onClick={() => setFormat('json')}
              className={cn('flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium', format === 'json' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]')}
            >
              <FileJson size={14} /> JSON
            </button>
            <button
              onClick={() => setFormat('sql')}
              className={cn('flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium', format === 'sql' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]')}
            >
              <Database size={14} /> SQL
            </button>
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept={format === 'json' ? '.json' : '.sql'} className="hidden" onChange={handleFile} />
      <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload size={14} /> {file ? file.name : 'Choose file'}
      </Button>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={format === 'json' ? '[{"book_key":"john","chapter_number":3,"verse_number":16,"text":"..."}]' : '-- Paste SQL insert statements'}
        rows={10}
        className="mt-3 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      />

      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => void runImport()}><RefreshCw size={14} /> Import</Button>
        <Button size="sm" variant="ghost" onClick={() => { setContent(''); setFile(null); }}><X size={14} /> Clear</Button>
      </div>
    </Card>
  );
}
