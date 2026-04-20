import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types';

type Template = Tables<'templates'>;
type TemplateInsert = TablesInsert<'templates'>;
type TemplateUpdate = TablesUpdate<'templates'>;

const QUERY_TIMEOUT_MS = 5000;

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchTemplates = useCallback(async () => {
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
      .from('templates')
      .select('*')
      .order('type', { ascending: true });

    if (timedOut.current) return;
    clearTimeout(timeoutRef.current);

    if (queryError) {
      console.error('[useTemplates] fetch:', queryError.message);
      setTemplates([]);
      setError(`Failed to load templates: ${queryError.message}`);
    } else {
      setTemplates(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
    return () => clearTimeout(timeoutRef.current);
  }, [fetchTemplates]);

  const createTemplate = async (template: TemplateInsert): Promise<Template | null> => {
    const { data, error } = await supabase
      .from('templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      console.error('[useTemplates] create:', error.message);
      return null;
    }
    await fetchTemplates();
    return data;
  };

  const updateTemplate = async (id: string, updates: TemplateUpdate): Promise<boolean> => {
    const { error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[useTemplates] update:', error.message);
      return false;
    }
    await fetchTemplates();
    return true;
  };

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    refetch: fetchTemplates,
  };
}

export const TYPE_LABELS: Record<string, string> = {
  email_initial: 'Email — Initial Outreach',
  email_followup: 'Email — Follow-Up',
  email_thankyou: 'Email — Thank You',
  script_bltr: 'Script — BLTR Story',
  script_tcc: 'Script — TCC Story',
  script_phone: 'Script — Phone Contact',
  other: 'Other',
};

export const TYPE_GROUPS: Record<string, string[]> = {
  'Email Templates': ['email_initial', 'email_followup', 'email_thankyou'],
  'Scripts': ['script_bltr', 'script_tcc', 'script_phone'],
  'Other': ['other'],
};

export function renderMergeFields(body: string, data: Record<string, string>): string {
  let result = body;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  // Strip any remaining unreplaced merge fields so users never see raw brackets
  result = result.replace(/\{\{[a-z_]+\}\}/g, '');
  // Clean up any double-spaces left behind
  result = result.replace(/  +/g, ' ');
  return result;
}

/** All supported merge fields with human-readable labels */
export const ALL_MERGE_FIELDS: { field: string; label: string }[] = [
  { field: '{{contact_name}}', label: 'Contact Name' },
  { field: '{{business_name}}', label: 'Business Name' },
  { field: '{{rotary_member_name}}', label: 'Your Name' },
  { field: '{{rotary_club_name}}', label: 'Club Name' },
  { field: '{{specific_need}}', label: 'Business Need' },
  { field: '{{city}}', label: 'City' },
  { field: '{{state}}', label: 'State' },
  { field: '{{email}}', label: 'Business Email' },
  { field: '{{phone}}', label: 'Business Phone' },
  { field: '{{industry}}', label: 'Industry' },
];

export type { Template, TemplateInsert, TemplateUpdate };
