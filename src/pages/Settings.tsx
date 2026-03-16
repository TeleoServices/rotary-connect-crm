import { useState, useEffect } from 'react';
import { Download, Lock, Save, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sanitizeCSVField } from '@/lib/sanitize';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Database } from '@/lib/types';

type TableName = keyof Database['public']['Tables'];

const EXPORT_TABLES: TableName[] = ['businesses', 'interactions', 'business_needs', 'templates', 'team_members'];

export default function Settings() {
  // Org settings state
  const [orgName, setOrgName] = useState('');
  const [defaultCity, setDefaultCity] = useState('');
  const [defaultState, setDefaultState] = useState('');
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Load org settings on mount
  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from('org_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('[Settings] loadSettings:', error.message);
      } else if (data) {
        setSettingsId(data.id);
        setOrgName(data.org_name);
        setDefaultCity(data.default_city);
        setDefaultState(data.default_state);
      }
      setSettingsLoading(false);
    }
    loadSettings();
  }, []);

  const saveSettings = async () => {
    if (!settingsId) return;
    setSaving(true);
    setSaveStatus(null);

    const { error } = await supabase
      .from('org_settings')
      .update({
        org_name: orgName,
        default_city: defaultCity,
        default_state: defaultState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settingsId);

    setSaving(false);
    if (error) {
      console.error('[Settings] saveSettings:', error.message);
      setSaveStatus('Failed to save settings.');
    } else {
      setSaveStatus('Settings saved.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);

    if (newPassword.length < 6) {
      setPwStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);

    if (error) {
      console.error('[Settings] changePassword:', error.message);
      setPwStatus({ type: 'error', message: error.message });
    } else {
      setPwStatus({ type: 'success', message: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toCsv = (rows: Record<string, unknown>[]): string => {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const headerLine = headers.map(h => sanitizeCSVField(h)).join(',');
    const dataLines = rows.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (Array.isArray(val)) return sanitizeCSVField(val.join('; '));
        return sanitizeCSVField(String(val));
      }).join(',')
    );
    return [headerLine, ...dataLines].join('\n');
  };

  const exportData = async (table: TableName, format: 'csv' | 'json') => {
    setExporting(true);
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error('[Settings] export:', error.message);
      setExporting(false);
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    if (format === 'csv') {
      const csv = toCsv((data || []) as Record<string, unknown>[]);
      downloadFile(csv, `${table}-${dateStr}.csv`, 'text/csv');
    } else {
      downloadFile(JSON.stringify(data, null, 2), `${table}-${dateStr}.json`, 'application/json');
    }
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
            {settingsLoading ? (
              <LoadingSpinner />
            ) : (
              <>
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden="true" />
                    )}
                    Save
                  </button>
                  {saveStatus && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" aria-hidden="true" />
                      {saveStatus}
                    </span>
                  )}
                </div>
              </>
            )}
          </section>
        </ErrorBoundary>

        {/* Change Password */}
        <ErrorBoundary>
          <section className="set-password space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" aria-hidden="true" />
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label htmlFor="set-new-pw" className="block text-sm font-medium mb-1">New Password</label>
                <input
                  id="set-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
              <div>
                <label htmlFor="set-confirm-pw" className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  id="set-confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>

              {pwStatus && (
                <p
                  className={`text-sm ${pwStatus.type === 'error' ? 'text-destructive' : 'text-green-600'}`}
                  role="alert"
                >
                  {pwStatus.message}
                </p>
              )}

              <button
                type="submit"
                disabled={pwLoading || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {pwLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Lock className="h-4 w-4" aria-hidden="true" />
                )}
                Update Password
              </button>
            </form>
          </section>
        </ErrorBoundary>

        {/* Data Export */}
        <ErrorBoundary>
          <section className="set-export space-y-4">
            <h2 className="font-bold text-lg">Data Export</h2>
            <p className="text-sm text-muted-foreground">Download your data as CSV (for Excel) or JSON.</p>
            <div className="space-y-2">
              {EXPORT_TABLES.map(table => (
                <div key={table} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium capitalize">{table.replace(/_/g, ' ')}</span>
                  <button
                    onClick={() => exportData(table, 'csv')}
                    disabled={exporting}
                    aria-label={`Export ${table.replace(/_/g, ' ')} as CSV`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-input rounded-md text-xs hover:bg-accent disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    CSV
                  </button>
                  <button
                    onClick={() => exportData(table, 'json')}
                    disabled={exporting}
                    aria-label={`Export ${table.replace(/_/g, ' ')} as JSON`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-input rounded-md text-xs hover:bg-accent disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    JSON
                  </button>
                </div>
              ))}
            </div>
          </section>
        </ErrorBoundary>
      </div>
    </div>
  );
}
