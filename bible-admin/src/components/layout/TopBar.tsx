import { Search, Bell, Moon, Sun, Monitor, ChevronRight, User, Store, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

export function TopBar({ breadcrumbs }: { breadcrumbs?: { label: string; to?: string }[] }) {
  const navigate = useNavigate();
  const { theme, setTheme, resolved } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const { setCommandPaletteOpen } = useUiStore();

  const cycleTheme = () => {
    const order: Array<typeof theme> = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] md:flex"
        >
          <Search size={14} />
          <span className="text-sm">Search</span>
          <kbd className="ml-2 rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
            ⌘K
          </kbd>
        </button>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="hidden items-center gap-1 text-sm text-[var(--text-tertiary)] md:flex">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.label} className="flex items-center">
                {i > 0 && <ChevronRight size={14} className="mx-1" />}
                {crumb.to ? (
                  <button onClick={() => crumb.to && navigate(crumb.to)} className="hover:text-[var(--text-primary)]">
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[var(--text-primary)]">{crumb.label}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] md:hidden"
        >
          <Search size={18} />
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button
          onClick={cycleTheme}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
            resolved === 'dark' ? 'text-yellow-400' : ''
          )}
        >
          <ThemeIcon size={18} />
        </button>

        <button className="ml-1 flex h-9 items-center gap-2 rounded-lg bg-[var(--bg-hover)] px-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-active)]">
          <Store size={16} className="text-[var(--text-tertiary)]" />
          <span className="hidden sm:inline">Bible Admin</span>
          <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
        </button>

        <button
          onClick={() => void signOut().then(() => navigate('/login'))}
          className="ml-1 flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-2 text-sm font-medium text-white hover:bg-[var(--accent)]/90"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] text-white">
            {(user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <span className="hidden lg:inline">{user?.displayName ?? user?.email ?? 'Admin'}</span>
          <User size={14} className="lg:hidden" />
        </button>
      </div>
    </header>
  );
}
