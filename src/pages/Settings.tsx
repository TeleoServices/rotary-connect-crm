import { useState, useEffect } from 'react';
import { Download, Lock, Save, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
