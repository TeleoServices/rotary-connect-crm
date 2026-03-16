import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/lib/types';

type Interaction = Tables<'interactions'>;
type InteractionInsert = TablesInsert<'interactions'>;

export function useInteractions(businessId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });

    if (error) {
      console.error('[useInteractions] fetch:', error.message);
      setInteractions([]);
    } else {
      setInteractions(data ?? []);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchInteractions();
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
    createInteraction,
    refetch: fetchInteractions,
  };
}

export type { Interaction, InteractionInsert };
