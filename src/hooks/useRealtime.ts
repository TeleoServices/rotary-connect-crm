import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/types';

type Interaction = Tables<'interactions'>;

export function useRecentActivity(limit = 10) {
  const [activities, setActivities] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[useRecentActivity] fetch:', error.message);
      setActivities([]);
    } else {
      setActivities(data ?? []);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('recent-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'interactions' },
        () => {
          fetchRecent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecent]);

  return { activities, loading, refetch: fetchRecent };
}
