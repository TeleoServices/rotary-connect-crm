import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types';

type BusinessNeed = Tables<'business_needs'>;
type NeedInsert = TablesInsert<'business_needs'>;
type NeedUpdate = TablesUpdate<'business_needs'>;

export interface NeedFilters {
  category?: string;
  priority?: string;
  status?: string;
  businessId?: string;
}

const QUERY_TIMEOUT_MS = 5000;

export function useNeeds(filters?: NeedFilters) {
  const [needs, setNeeds] = useState<BusinessNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchNeeds = useCallback(async () => {
    setLoading(true);
    setError(null);

    clearTimeout(timeoutRef.current);
    const timedOut = { current: false };
    timeoutRef.current = setTimeout(() => {
      timedOut.current = true;
      setLoading(false);
      setError('Request timed out — please try refreshing');
    }, QUERY_TIMEOUT_MS);

    try {
      let query = supabase.from('business_needs').select('*');

      if (filters?.businessId) query = query.eq('business_id', filters.businessId);
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.priority) query = query.eq('priority', filters.priority);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (timedOut.current) return;
      clearTimeout(timeoutRef.current);

      if (queryError) {
        console.error('[useNeeds] fetch:', queryError.message);
        setNeeds([]);
        setError(`Failed to load needs: ${queryError.message}`);
        setLoading(false);
        return;
      }
      setNeeds(data ?? []);
      setLoading(false);
    } catch (err: unknown) {
      if (timedOut.current) return;
      clearTimeout(timeoutRef.current);
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useNeeds] unexpected:', message);
      setNeeds([]);
      setError(`Failed to load needs: ${message}`);
      setLoading(false);
    }
  }, [filters?.businessId, filters?.category, filters?.priority, filters?.status]);

  useEffect(() => {
    fetchNeeds();
    return () => clearTimeout(timeoutRef.current);
  }, [fetchNeeds]);

  const createNeed = async (need: NeedInsert): Promise<BusinessNeed | null> => {
    const { data, error } = await supabase
      .from('business_needs')
      .insert(need)
      .select()
      .single();

    if (error) {
      console.error('[useNeeds] create:', error.message);
      return null;
    }
    await fetchNeeds();
    return data;
  };

  const updateNeed = async (id: string, updates: NeedUpdate): Promise<boolean> => {
    const { error } = await supabase
      .from('business_needs')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[useNeeds] update:', error.message);
      return false;
    }
    await fetchNeeds();
    return true;
  };

  const deleteNeed = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('business_needs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[useNeeds] delete:', error.message);
      return false;
    }
    await fetchNeeds();
    return true;
  };

  return {
    needs,
    loading,
    error,
    createNeed,
    updateNeed,
    deleteNeed,
    refetch: fetchNeeds,
  };
}

export const NEED_CATEGORIES = [
  'workforce', 'marketing', 'technology', 'funding', 'mentorship',
  'networking', 'space', 'compliance', 'training', 'community_engagement', 'other',
] as const;

export const NEED_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export const NEED_STATUSES = ['identified', 'researching', 'solution_proposed', 'resolved', 'deferred'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  workforce: 'Workforce',
  marketing: 'Marketing',
  technology: 'Technology',
  funding: 'Funding',
  mentorship: 'Mentorship',
  networking: 'Networking',
  space: 'Space',
  compliance: 'Compliance',
  training: 'Training',
  community_engagement: 'Community Engagement',
  other: 'Other',
};

export const STATUS_LABELS: Record<string, string> = {
  identified: 'Identified',
  researching: 'Researching',
  solution_proposed: 'Solution Proposed',
  resolved: 'Resolved',
  deferred: 'Deferred',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export type { BusinessNeed, NeedInsert, NeedUpdate };
