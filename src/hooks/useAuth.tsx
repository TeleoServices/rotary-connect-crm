import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react';
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

const AUTH_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });
  const resolved = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<TeamMember | null> => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[useAuth] fetchProfile:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[useAuth] fetchProfile exception:', err);
      return null;
    }
  }, []);

  const ensureProfile = useCallback(async (user: User): Promise<TeamMember | null> => {
    try {
      let profile = await fetchProfile(user.id);
      if (!profile) {
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
          profile = await fetchProfile(user.id);
          return profile;
        }
        profile = data;
      }
      return profile;
    } catch (err) {
      console.error('[useAuth] ensureProfile exception:', err);
      return null;
    }
  }, [fetchProfile]);

  /** Resolve auth state — called from listener or getSession */
  const resolve = useCallback(async (session: Session | null, mounted: { current: boolean }) => {
    if (!mounted.current) return;
    resolved.current = true;

    if (session?.user) {
      const profile = await ensureProfile(session.user);
      if (mounted.current) {
        setState({ user: session.user, session, profile, loading: false });
      }
    } else {
      if (mounted.current) {
        setState({ user: null, session: null, profile: null, loading: false });
      }
    }
  }, [ensureProfile]);

  useEffect(() => {
    const mounted = { current: true };

    // Timeout fallback — if auth hasn't resolved in 5s, clear loading
    const timeout = setTimeout(() => {
      if (mounted.current && !resolved.current) {
        console.warn('[useAuth] Auth resolution timed out after 5s — clearing loading state');
        setState({ user: null, session: null, profile: null, loading: false });
        resolved.current = true;
      }
    }, AUTH_TIMEOUT_MS);

    // Listen for ALL auth events including INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return;
        console.debug('[useAuth] onAuthStateChange:', event);

        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            await resolve(session, mounted);
            break;

          case 'SIGNED_OUT':
            resolved.current = true;
            if (mounted.current) {
              setState({ user: null, session: null, profile: null, loading: false });
            }
            break;

          default:
            // USER_UPDATED, PASSWORD_RECOVERY, etc.
            await resolve(session, mounted);
            break;
        }
      }
    );

    // Fallback: if onAuthStateChange doesn't fire INITIAL_SESSION quickly,
    // getSession() ensures we still resolve
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted.current || resolved.current) return;
      await resolve(session, mounted);
    }).catch((err) => {
      console.error('[useAuth] getSession error:', err);
      if (mounted.current && !resolved.current) {
        resolved.current = true;
        setState({ user: null, session: null, profile: null, loading: false });
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [resolve]);

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
