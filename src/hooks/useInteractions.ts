import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types';

type Interaction = Tables<'interactions'>;
type InteractionInsert = TablesInsert<'interactions'>;
type InteractionUpdate = TablesUpdate<'interactions'>;

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

  const updateInteraction = async (id: string, updates: InteractionUpdate): Promise<boolean> => {
    const { error } = await supabase
      .from('interactions')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[useInteractions] update:', error.message);
      return false;
    }
    await fetchInteractions();
    return true;
  };

  const deleteInteraction = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[useInteractions] delete:', error.message);
      return false;
    }
    await fetchInteractions();
    return true;
  };

  return {
    interactions,
    loading,
    error,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    refetch: fetchInteractions,
  };
}

export type { Interaction, InteractionInsert, InteractionUpdate };
