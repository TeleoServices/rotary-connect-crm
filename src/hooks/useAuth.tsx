import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ENV } from '@/lib/env';
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

const AUTH_TIMEOUT_MS = 3000;

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
  const resolve = useCallback(async (session: Session | null, mounted: { current: boolean }, reason: string) => {
    if (!mounted.current) return;
    resolved.current = true;

    if (session?.user) {
      console.log(`[auth] loading set to false, reason=${reason}, session=true, fetching profile...`);
      const profile = await ensureProfile(session.user);
      if (mounted.current) {
        setState({ user: session.user, session, profile, loading: false });
        console.log(`[auth] loading set to false, reason=${reason}, profile=${!!profile}`);
      }
    } else {
      console.log(`[auth] loading set to false, reason=${reason}, session=false`);
      if (mounted.current) {
        setState({ user: null, session: null, profile: null, loading: false });
      }
    }
  }, [ensureProfile]);

  useEffect(() => {
    const mounted = { current: true };
    const t0 = performance.now();
    const ts = () => `${(performance.now() - t0).toFixed(0)}ms`;

    // Primary check: getSession() — if no session, show login immediately
    console.log(`[auth] getSession started @ ${ts()}`);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log(`[auth] getSession returned @ ${ts()}: session=${!!session}`);
      if (!mounted.current || resolved.current) return;

      if (!session) {
        // No session — show login page immediately, don't wait for onAuthStateChange
        await resolve(null, mounted, 'getSession-no-session');
      } else {
        await resolve(session, mounted, 'getSession-has-session');
      }
    }).catch((err) => {
      console.error(`[auth] getSession error @ ${ts()}:`, err);
      if (mounted.current && !resolved.current) {
        resolved.current = true;
        console.log(`[auth] loading set to false, reason=getSession-error`);
        setState({ user: null, session: null, profile: null, loading: false });
      }
    });

    // Safety net timeout — if auth hasn't resolved in 3s, clear stale session and show login
    const timeout = setTimeout(() => {
      if (mounted.current && !resolved.current) {
        console.warn(`[auth] Auth resolution timed out after 3s @ ${ts()} — clearing stale session`);
        // Clear any stale Supabase auth token from localStorage
        try {
          const projectRef = ENV.SUPABASE_URL.split('//')[1].split('.')[0];
          localStorage.removeItem(`sb-${projectRef}-auth-token`);
          console.log(`[auth] cleared stale localStorage token for project ${projectRef}`);
        } catch (e) {
          console.warn('[auth] could not clear localStorage:', e);
        }
        setState({ user: null, session: null, profile: null, loading: false });
        resolved.current = true;
      }
    }, AUTH_TIMEOUT_MS);

    // Listen for auth state changes (handles sign-in, sign-out, token refresh after initial load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return;
        console.log(`[auth] onAuthStateChange fired @ ${ts()}: event=${event}`);

        switch (event) {
          case 'INITIAL_SESSION':
            // getSession() is primary — only use INITIAL_SESSION if getSession hasn't resolved yet
            if (!resolved.current) {
              await resolve(session, mounted, 'onAuthStateChange-INITIAL_SESSION');
            }
            break;

          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            await resolve(session, mounted, `onAuthStateChange-${event}`);
            break;

          case 'SIGNED_OUT':
            resolved.current = true;
            console.log(`[auth] loading set to false, reason=onAuthStateChange-SIGNED_OUT`);
            if (mounted.current) {
              setState({ user: null, session: null, profile: null, loading: false });
            }
            break;

          default:
            await resolve(session, mounted, `onAuthStateChange-${event}`);
            break;
        }
      }
    );

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
    // Clear state immediately so the UI redirects to /login
    setState({ user: null, session: null, profile: null, loading: false });
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
