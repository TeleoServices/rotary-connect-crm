import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/types';

type TeamMember = Tables<'team_members'>;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: TeamMember | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Profile doesn't exist yet — create one on first login
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[useAuth] fetchProfile:', error.message);
      return null;
    }
    return data;
  }, []);

  const ensureProfile = useCallback(async (user: User) => {
    let profile = await fetchProfile(user.id);
    if (!profile) {
      // Auto-create team_members row on first login
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Member',
          email: user.email,
          role: 'member',
        })
        .select()
        .single();

      if (error) {
        console.error('[useAuth] ensureProfile:', error.message);
        return null;
      }
      profile = data;
    }
    return profile;
  }, [fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await ensureProfile(session.user);
        setState({ user: session.user, session, profile, loading: false });
      } else {
        setState({ user: null, session: null, profile: null, loading: false });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await ensureProfile(session.user);
          setState({ user: session.user, session, profile, loading: false });
        } else {
          setState({ user: null, session: null, profile: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [ensureProfile]);

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('[useAuth] signInWithMagicLink:', error.message);
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[useAuth] signOut:', error.message);
    }
  };

  return {
    ...state,
    signInWithMagicLink,
    signOut,
    isAdmin: state.profile?.role === 'admin',
    isLead: state.profile?.role === 'lead' || state.profile?.role === 'admin',
  };
}
