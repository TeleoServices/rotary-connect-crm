/**
 * =============================================
 * SUPABASE CALL PATTERN — ALL CALLS FOLLOW THIS
 * =============================================
 *
 * READS:
 *   const { data, error } = await supabase.from('table').select('*');
 *   if (error) { console.error('[context]:', error.message); return null; }
 *   return data;
 *
 * WRITES:
 *   const { data, error } = await supabase.from('table').insert({ ... }).select().single();
 *   if (error) { console.error('[context]:', error.message); return null; }
 *   return data;
 *
 * RULES:
 *   - NEVER throw from a Supabase call
 *   - ALWAYS return null/[] on error
 *   - ALWAYS log with context prefix: '[BusinessDetail]:', '[NeedsTracker]:', etc.
 *   - UI components handle null gracefully with empty states, NEVER blank screens
 *   - One flaky query must never crash the entire page — isolate failures
 */

import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';
import type { Database } from './types';

export const supabase = createClient<Database>(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
