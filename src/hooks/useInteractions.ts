import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/lib/types';

type Interaction = Tables<'interactions'>;
type InteractionInsert = TablesInsert<'interactions'>;

const QUERY_TIMEOUT_MS = 5000;

export function useInteractions(businessId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchInteractions = useCallback(async () => {
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
      .from('interactions')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });

    if (timedOut.current) return;
    clearTimeout(timeoutRef.current);

    if (queryError) {
      console.error('[useInteractions] fetch:', queryError.message);
      setInteractions([]);
      setError(`Failed to load interactions: ${queryError.message}`);
    } else {
      setInteractions(data ?? []);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchInteractions();
    return () => clearTimeout(timeoutRef.current);
  }, [fetchInteractions]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`interactions-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          fetchInteractions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchInteractions]);

  const createInteraction = async (interaction: InteractionInsert): Promise<Interaction | null> => {
    const { data, error } = await supabase
      .from('interactions')
      .insert(interaction)
      .select()
      .single();

    if (error) {
      console.error('[useInteractions] create:', error.message);
      return null;
    }
    await fetchInteractions();
    return data;
  };

  return {
    interactions,
    loading,
    error,
    createInteraction,
    refetch: fetchInteractions,
  };
}

export type { Interaction, InteractionInsert };
