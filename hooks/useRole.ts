// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import type { CmsUser, UserRole, Vertical } from '@/types/database';

interface UseRoleReturn {
  cmsUser: CmsUser | null;
  role: UserRole | null;
  verticals: Vertical[];
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canManageUsers: boolean;
  hasVerticalAccess: (verticalId: string | null) => boolean;
  refetch: () => Promise<void>;
}

export function useRole(): UseRoleReturn {
  const { user } = useAuth();
  const [cmsUser, setCmsUser] = useState<CmsUser | null>(null);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setCmsUser(null);
      setVerticals([]);
      setLoading(false);
      return;
    }

    // Fetch cms_user profile
    let { data: profile } = await supabase
      .from('cms_users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    // Fallback: self-provision if trigger didn't fire
    if (!profile) {
      const { data: newProfile } = await supabase
        .from('cms_users')
        .upsert({
          auth_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          role: 'viewer' as UserRole,
        }, { onConflict: 'auth_id' })
        .select()
        .single();
      profile = newProfile;
    }

    setCmsUser(profile);

    // Fetch assigned verticals for any role
    // No verticals assigned = access to everything
    // Verticals assigned = access only to those
    if (profile) {
      const { data: userVerticals } = await supabase
        .from('user_verticals')
        .select('vertical_id')
        .eq('user_id', profile.id);

      if (userVerticals && userVerticals.length > 0) {
        const verticalIds = userVerticals.map((uv) => uv.vertical_id);
        const { data: verts } = await supabase
          .from('verticals')
          .select('*')
          .in('id', verticalIds);
        setVerticals(verts || []);
      } else {
        setVerticals([]);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const role = cmsUser?.role ?? null;
  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';
  const isViewer = role === 'viewer';
  const canEdit = isAdmin || isEditor;
  const canManageUsers = isAdmin;

  const hasVerticalAccess = useCallback(
    (verticalId: string | null): boolean => {
      if (verticalId === null) return true; // Ecossistema — accessible to all
      if (verticals.length === 0) return true; // No verticals assigned = access to everything
      return verticals.some((v) => v.id === verticalId);
    },
    [verticals]
  );

  return {
    cmsUser,
    role,
    verticals,
    loading,
    isAdmin,
    isEditor,
    isViewer,
    canEdit,
    canManageUsers,
    hasVerticalAccess,
    refetch: fetchRole,
  };
}
