import { useState } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import type { Database } from '@/lib/types';

type TableName = keyof Database['public']['Tables'];

const EXPORT_TABLES: TableName[] = ['businesses', 'interactions', 'business_needs', 'templates', 'team_members'];

export default function Settings() {
  const [orgName, setOrgName] = useState('Rotary Club');
  const [defaultCity, setDefaultCity] = useState('');
  const [defaultState, setDefaultState] = useState('');
  const [exporting, setExporting] = useState(false);

  const exportData = async (table: TableName) => {
    setExporting(true);
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error('[Settings] export:', error.message);
      setExporting(false);
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-8 max-w-lg">
        {/* Organization */}
        <ErrorBoundary>
          <section className="set-form space-y-4">
            <h2 className="font-bold text-lg">Organization</h2>
            <div>
              <label htmlFor="set-org-name" className="block text-sm font-medium mb-1">Organization Name</label>
              <input
                id="set-org-name"
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="set-city" className="block text-sm font-medium mb-1">Default City</label>
                <input
                  id="set-city"
                  type="text"
                  value={defaultCity}
                  onChange={e => setDefaultCity(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
              <div>
                <label htmlFor="set-state" className="block text-sm font-medium mb-1">Default State</label>
                <input
                  id="set-state"
                  type="text"
                  value={defaultState}
                  onChange={e => setDefaultState(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
            </div>
          </section>
        </ErrorBoundary>

        {/* Data Export */}
        <ErrorBoundary>
          <section className="set-export space-y-4">
            <h2 className="font-bold text-lg">Data Export</h2>
            <p className="text-sm text-muted-foreground">Download your data as JSON files.</p>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_TABLES.map(table => (
                <button
                  key={table}
                  onClick={() => exportData(table)}
                  disabled={exporting}
                  aria-label={`Export ${table.replace('_', ' ')} data`}
                  className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent disabled:opacity-50"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {table.replace('_', ' ')}
                </button>
              ))}
            </div>
          </section>
        </ErrorBoundary>
      </div>
    </div>
  );
}
