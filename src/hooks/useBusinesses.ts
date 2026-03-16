import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types';

type Business = Tables<'businesses'>;
type BusinessInsert = TablesInsert<'businesses'>;
type BusinessUpdate = TablesUpdate<'businesses'>;

export interface BusinessFilters {
  search?: string;
  status?: string;
  industry?: string;
  assignedTo?: string;
  hasTags?: string[];
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BusinessFilters>({});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 25,
    total: 0,
  });

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('businesses').select('*', { count: 'exact' });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.industry) query = query.eq('industry', filters.industry);
      if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
      if (filters.search) query = query.ilike('name', `%${filters.search}%`);

      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('[useBusinesses] fetch:', error.message);
        setBusinesses([]);
        return;
      }

      setBusinesses(data ?? []);
      setPagination(prev => ({ ...prev, total: count ?? 0 }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useBusinesses] unexpected:', message);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const createBusiness = async (business: BusinessInsert): Promise<Business | null> => {
    const { data, error } = await supabase
      .from('businesses')
      .insert(business)
      .select()
      .single();

    if (error) {
      console.error('[useBusinesses] create:', error.message);
      return null;
    }
    await fetchBusinesses();
    return data;
  };

  const updateBusiness = async (id: string, updates: BusinessUpdate): Promise<Business | null> => {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[useBusinesses] update:', error.message);
      return null;
    }
    await fetchBusinesses();
    return data;
  };

  const deleteBusiness = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[useBusinesses] delete:', error.message);
      return false;
    }
    await fetchBusinesses();
    return true;
  };

  const bulkUpdate = async (ids: string[], updates: BusinessUpdate): Promise<boolean> => {
    const { error } = await supabase
      .from('businesses')
      .update(updates)
      .in('id', ids);

    if (error) {
      console.error('[useBusinesses] bulkUpdate:', error.message);
      return false;
    }
    await fetchBusinesses();
    return true;
  };

  const bulkInsert = async (rows: BusinessInsert[]): Promise<number> => {
    const { data, error } = await supabase
      .from('businesses')
      .insert(rows)
      .select();

    if (error) {
      console.error('[useBusinesses] bulkInsert:', error.message);
      return 0;
    }
    await fetchBusinesses();
    return data?.length ?? 0;
  };

  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const setPageSize = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 0 }));
  };

  return {
    businesses,
    loading,
    filters,
    setFilters,
    pagination,
    setPage,
    setPageSize,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    bulkUpdate,
    bulkInsert,
    refetch: fetchBusinesses,
  };
}

export type { Business, BusinessInsert, BusinessUpdate };
