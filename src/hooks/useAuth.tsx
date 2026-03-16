import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
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

interface AuthContextValue extends AuthState {
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isLead: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string): Promise<TeamMember | null> => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found — will create in ensureProfile
        return null;
      }
      console.error('[useAuth] fetchProfile:', error.message);
      return null;
    }
    return data;
  }, []);

  const ensureProfile = useCallback(async (user: User): Promise<TeamMember | null> => {
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
        console.error('[useAuth] ensureProfile insert:', error.message);
        // INSERT may fail due to RLS or duplicate key — try fetching again
        // (another instance may have created it, or it existed but had a transient error)
        profile = await fetchProfile(user.id);
        return profile;
      }
      profile = data;
    }
    return profile;
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await ensureProfile(session.user);
        if (mounted) {
          setState({ user: session.user, session, profile, loading: false });
        }
      } else {
        if (mounted) {
          setState({ user: null, session: null, profile: null, loading: false });
        }
      }
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        // Skip INITIAL_SESSION — already handled by getSession above
        if (event === 'INITIAL_SESSION') return;

        if (session?.user) {
          const profile = await ensureProfile(session.user);
          if (mounted) {
            setState({ user: session.user, session, profile, loading: false });
          }
        } else {
          if (mounted) {
            setState({ user: null, session: null, profile: null, loading: false });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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

  const value: AuthContextValue = {
    ...state,
    signInWithMagicLink,
    signOut,
    isAdmin: state.profile?.role === 'admin',
    isLead: state.profile?.role === 'lead' || state.profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
