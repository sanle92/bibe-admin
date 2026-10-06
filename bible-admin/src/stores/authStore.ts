import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import { logAudit } from '@/services/auditLogService';

export type AdminRole = 'super' | 'admin' | 'editor' | 'translator' | 'support' | 'moderator' | 'author' | 'viewer' | string;

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  role: AdminRole;
  avatarUrl?: string;
}

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  init: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

export type Permission =
  | 'users:read' | 'users:write' | 'users:delete'
  | 'content:read' | 'content:write' | 'content:delete'
  | 'prayers:read' | 'prayers:write'
  | 'journal:read' | 'journal:write'
  | 'settings:read' | 'settings:write'
  | 'translations:write'
  | 'community:moderate'
  | 'notifications:send'
  | 'media:manage'
  | 'analytics:read';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super: ['users:read', 'users:write', 'users:delete', 'content:read', 'content:write', 'content:delete', 'prayers:read', 'prayers:write', 'journal:read', 'journal:write', 'settings:read', 'settings:write', 'translations:write', 'community:moderate', 'notifications:send', 'media:manage', 'analytics:read'],
  admin: ['users:read', 'users:write', 'content:read', 'content:write', 'content:delete', 'prayers:read', 'prayers:write', 'journal:read', 'journal:write', 'settings:read', 'community:moderate', 'notifications:send', 'media:manage', 'analytics:read'],
  editor: ['content:read', 'content:write', 'content:delete', 'media:manage'],
  translator: ['translations:write', 'content:read'],
  support: ['users:read', 'content:read', 'prayers:read', 'journal:read'],
  moderator: ['users:read', 'content:read', 'content:write', 'prayers:read', 'prayers:write', 'journal:read', 'journal:write', 'settings:read', 'community:moderate'],
  author: ['content:read', 'content:write'],
  viewer: ['users:read', 'content:read', 'prayers:read', 'journal:read', 'settings:read'],
};

const ROLE_PRIORITY: AdminRole[] = ['super', 'admin', 'editor', 'translator', 'moderator', 'support', 'author', 'viewer'];

async function fetchTopRole(userId: string): Promise<AdminRole> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  if (!data || data.length === 0) return 'viewer';
  for (const priority of ROLE_PRIORITY) {
    if (data.some((r: { role: string }) => r.role === priority)) return priority;
  }
  return (data[0] as { role: AdminRole }).role ?? 'viewer';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: error?.message ?? 'Sign in failed' };
    const role = await fetchTopRole(data.user.id);
    void logAudit({
      user_id: data.user.id,
      action: 'login',
      target_type: 'auth',
      details: { role },
    });
    set({
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
        displayName: data.user.user_metadata?.display_name,
        role,
      },
      loading: false,
    });
    return {};
  },
  signOut: async () => {
    const user = get().user;
    await supabase.auth.signOut();
    if (user) {
      void logAudit({
        user_id: user.id,
        action: 'logout',
        target_type: 'auth',
      });
    }
    set({ user: null, loading: false });
  },
  init: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const role = await fetchTopRole(data.session.user.id);
      set({
        user: {
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          displayName: data.session.user.user_metadata?.display_name,
          role,
        },
        loading: false,
      });
    } else {
      set({ loading: false });
    }
  },
  hasPermission: (permission) => {
    const role = get().user?.role;
    if (!role) return false;
    return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
  },
}));
