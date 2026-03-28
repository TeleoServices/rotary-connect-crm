import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/types';

type Interaction = Tables<'interactions'>;

const QUERY_TIMEOUT_MS = 5000;

export function useRecentActivity(limit = 10) {
  const [activities, setActivities] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchRecent = useCallback(async () => {
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
      .order('created_at', { ascending: false })
      .limit(limit);

    if (timedOut.current) return;
    clearTimeout(timeoutRef.current);

    if (queryError) {
      console.error('[useRecentActivity] fetch:', queryError.message);
      setActivities([]);
      setError(`Failed to load recent activity: ${queryError.message}`);
    } else {
      setActivities(data ?? []);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchRecent();
    return () => clearTimeout(timeoutRef.current);
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

  return { activities, loading, error, refetch: fetchRecent };
}
