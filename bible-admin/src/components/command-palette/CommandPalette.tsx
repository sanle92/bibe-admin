import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, LayoutDashboard, Users, FileText, Mic, HandHeart, BookText, Shield, Settings, Bookmark, CalendarCheck, BarChart3 } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore, type Permission } from '@/stores/authStore';
import { cn } from '@/utils/cn';

interface CommandItem {
  id: string;
  label: string;
  to: string;
  icon: React.ElementType;
  permission?: Permission;
}

const COMMANDS: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { id: 'users', label: 'Users', to: '/users', icon: Users, permission: 'users:read' },
  { id: 'notes', label: 'Notes', to: '/content/notes', icon: FileText, permission: 'content:read' },
  { id: 'sermons', label: 'Sermons', to: '/content/sermons', icon: Mic, permission: 'content:read' },
  { id: 'highlights', label: 'Highlights', to: '/content/highlights', icon: Bookmark, permission: 'content:read' },
  { id: 'reading-plans', label: 'Reading Plans', to: '/reading-plans', icon: CalendarCheck, permission: 'content:read' },
  { id: 'statistics', label: 'Statistics', to: '/statistics', icon: BarChart3, permission: 'settings:read' },
  { id: 'prayers', label: 'Prayers', to: '/prayers', icon: HandHeart, permission: 'prayers:read' },
  { id: 'journal', label: 'Journal', to: '/journal', icon: BookText, permission: 'journal:read' },
  { id: 'roles', label: 'Roles', to: '/roles', icon: Shield, permission: 'settings:write' },
  { id: 'settings', label: 'Settings', to: '/settings', icon: Settings, permission: 'settings:read' },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMANDS.filter((c) => (!c.permission || hasPermission(c.permission)) && c.label.toLowerCase().includes(q));
  }, [query, hasPermission]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const run = (item: CommandItem) => {
    navigate(item.to);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      run(filtered[selectedIndex]);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onClick={() => setCommandPaletteOpen(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <Search size={18} className="text-[var(--text-tertiary)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            autoFocus
          />
          <button onClick={() => setCommandPaletteOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && <p className="p-4 text-center text-sm text-[var(--text-tertiary)]">No results.</p>}
          {filtered.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => run(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  index === selectedIndex ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
