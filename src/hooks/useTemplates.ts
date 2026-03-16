import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types';

type Template = Tables<'templates'>;
type TemplateInsert = TablesInsert<'templates'>;
type TemplateUpdate = TablesUpdate<'templates'>;

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('type', { ascending: true });

    if (error) {
      console.error('[useTemplates] fetch:', error.message);
      setTemplates([]);
    } else {
      setTemplates(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
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
  return result;
}

export type { Template, TemplateInsert, TemplateUpdate };
