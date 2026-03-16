import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/types';

type TeamMember = Tables<'team_members'>;

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('[useTeam] fetch:', error.message);
      setMembers([]);
    } else {
      setMembers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
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
    inviteMember,
    updateMember,
    refetch: fetchMembers,
  };
}

export type { TeamMember };
