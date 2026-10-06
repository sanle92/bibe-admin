import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from '@/components/command-palette/CommandPalette';

export function AppLayout() {
  const { pathname } = useLocation();

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)]">
      <Sidebar />
      <div className="flex flex-1 flex-col md:ml-0">
        <TopBar breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

function generateBreadcrumbs(pathname: string): { label: string; to?: string }[] {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: 'Dashboard' }];
  const out: { label: string; to?: string }[] = [{ label: 'Dashboard', to: '/' }];
  let path = '';
  for (const part of parts) {
    path += `/${part}`;
    out.push({ label: capitalize(part), to: path });
  }
  out[out.length - 1].to = undefined;
  return out;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
