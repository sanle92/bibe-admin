import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Mic,
  HandHeart,
  BookText,
  Bookmark,
  CalendarCheck,
  Settings,
  Shield,
  X,
  Menu,
  BarChart3,
  BarChart,
  Book,
  BookOpen,
  Layers,
  Bell,
  Image,
  ClipboardList,
  Server,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore, type Permission } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  permission?: Permission;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/analytics', label: 'Analytics', icon: BarChart, permission: 'settings:read' },
      { to: '/statistics', label: 'Statistics', icon: BarChart3, permission: 'settings:read' },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/content/notes', label: 'Notes', icon: FileText, permission: 'content:read' },
      { to: '/content/sermons', label: 'Sermons', icon: Mic, permission: 'content:read' },
      { to: '/content/highlights', label: 'Highlights', icon: Bookmark, permission: 'content:read' },
      { to: '/reading-plans', label: 'Reading Plans', icon: CalendarCheck, permission: 'content:read' },
      { to: '/media', label: 'Media', icon: Image, permission: 'content:write' },
    ],
  },
  {
    title: 'Library',
    items: [
      { to: '/translations', label: 'Translations', icon: Book, permission: 'content:write' },
      { to: '/dictionary', label: 'Dictionary', icon: BookOpen, permission: 'content:write' },
      { to: '/topics', label: 'Topics', icon: Layers, permission: 'content:write' },
    ],
  },
  {
    title: 'Community',
    items: [
      { to: '/users', label: 'Users', icon: Users, permission: 'users:read' },
      { to: '/community', label: 'Community', icon: Users, permission: 'content:write' },
      { to: '/prayers', label: 'Prayers', icon: HandHeart, permission: 'prayers:read' },
      { to: '/journal', label: 'Journal', icon: BookText, permission: 'journal:read' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell, permission: 'settings:write' },
      { to: '/roles', label: 'Roles', icon: Shield, permission: 'settings:write' },
      { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, permission: 'settings:read' },
      { to: '/system', label: 'System', icon: Server, permission: 'settings:write' },
      { to: '/backups', label: 'Backups', icon: Database, permission: 'settings:write' },
      { to: '/security', label: 'Security', icon: ShieldAlert, permission: 'settings:write' },
      { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings:read' },
    ],
  },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm md:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-transform duration-200 md:translate-x-0 md:sticky md:top-0 md:h-screen md:w-60',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
            <Shield size={18} />
          </div>
          <span className="text-lg font-bold text-[var(--text-primary)]">Bible Admin</span>
        </div>

        <nav className="space-y-6 px-3 py-4">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => window.innerWidth < 768 && toggleSidebar()}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <span className={cn(
                        'flex h-5 w-5 items-center justify-center',
                        active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
                      )}>
                        <Icon size={18} />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={toggleSidebar} />}
    </>
  );
}
