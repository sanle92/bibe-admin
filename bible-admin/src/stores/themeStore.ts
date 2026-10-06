import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  applyTheme: () => void;
}

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolved: resolve('system'),
      setTheme: (theme) => {
        set({ theme, resolved: resolve(theme) });
        get().applyTheme();
      },
      applyTheme: () => {
        const resolved = resolve(get().theme);
        document.documentElement.classList.toggle('dark', resolved === 'dark');
        set({ resolved });
      },
    }),
    { name: 'bible-admin-theme' }
  )
);
