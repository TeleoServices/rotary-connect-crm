import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/types';

type TeamMember = Tables<'team_members'>;

const QUERY_TIMEOUT_MS = 5000;

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    clearTimeout(timeoutRef.current);
    const timedOut = { current: false };
    timeoutRef.current = setTimeout(() => {
      timedOut.current = true;
      setLoading(false);
      setError('Request timed out — please try refreshing');
    }, QUERY_TIMEOUT_MS);

    const { data, error: queryError } = await supabase
      .from('team_members')
      .select('*')
      .order('full_name', { ascending: true });

    if (timedOut.current) return;
    clearTimeout(timeoutRef.current);

    if (queryError) {
      console.error('[useTeam] fetch:', queryError.message);
      setMembers([]);
      setError(`Failed to load team members: ${queryError.message}`);
    } else {
      setMembers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
    return () => clearTimeout(timeoutRef.current);
  }, [fetchMembers]);

  const inviteMember = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.admin.inviteUserByEmail(email);
    if (error) {
      // Fall back to magic link invite if admin API isn't available
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (otpError) {
        console.error('[useTeam] invite:', otpError.message);
        return { error: otpError.message };
      }
    }
    return { error: null };
  };

  const updateMember = async (id: string, updates: Partial<TeamMember>): Promise<boolean> => {
    const { error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[useTeam] update:', error.message);
      return false;
    }
    await fetchMembers();
    return true;
  };

  return {
    members,
    loading,
    error,
    inviteMember,
    updateMember,
    refetch: fetchMembers,
  };
}

export type { TeamMember };
