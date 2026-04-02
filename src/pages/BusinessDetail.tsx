import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/lib/types';
import { useInteractions, type Interaction } from '@/hooks/useInteractions';
import { useNeeds, type BusinessNeed } from '@/hooks/useNeeds';
import { StatusBadge } from '@/components/businesses/StatusBadge';
import { ActivityForm } from '@/components/interactions/ActivityForm';
import { Timeline } from '@/components/interactions/Timeline';
import { NeedForm } from '@/components/needs/NeedForm';
import { NeedCard } from '@/components/needs/NeedCard';
import { EmailTab } from '@/components/interactions/EmailTab';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QueryError } from '@/components/common/QueryError';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

type Business = Tables<'businesses'>;

const TABS = ['Overview', 'Activity', 'Needs', 'Emails'] as const;
type Tab = (typeof TABS)[number];

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<TablesUpdate<'businesses'>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { interactions, loading: interactionsLoading, error: interactionsError, createInteraction, updateInteraction, deleteInteraction, refetch: refetchInteractions } = useInteractions(id || '');
  const { needs, loading: needsLoading, error: needsError, createNeed, updateNeed, deleteNeed, refetch: refetchNeeds } = useNeeds({ businessId: id });

  // Edit mode state for interactions and needs
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [editingNeed, setEditingNeed] = useState<BusinessNeed | null>(null);

  const fetchBusiness = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    clearTimeout(timeoutRef.current);
    const timedOut = { current: false };
    timeoutRef.current = setTimeout(() => {
      timedOut.current = true;
      setLoading(false);
      setError('Request timed out — please try refreshing');
    }, 5000);

    const { data, error: queryError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (timedOut.current) return;
    clearTimeout(timeoutRef.current);

    if (queryError) {
      console.error('[BusinessDetail] fetch:', queryError.message);
      setBusiness(null);
      setError(`Failed to load business: ${queryError.message}`);
    } else {
      setBusiness(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBusiness();
    return () => clearTimeout(timeoutRef.current);
  }, [fetchBusiness]);

  const startEditing = () => {
    if (!business) return;
    setEditForm({
      name: business.name,
      industry: business.industry,
      contact_name: business.contact_name,
      contact_title: business.contact_title,
      email: business.email,
      phone: business.phone,
      address: business.address,
      city: business.city,
      state: business.state,
      zip: business.zip,
      website: business.website,
      notes: business.notes,
      status: business.status,
    });
    setEditing(true);
  };

  const saveEdits = async () => {
    if (!id) return;
    if (!editForm.name || !(editForm.name as string).trim()) return;
    const { error } = await supabase
      .from('businesses')
      .update(editForm)
      .eq('id', id);

    if (error) {
      console.error('[BusinessDetail] update:', error.message);
      return;
    }
    setEditing(false);
    await fetchBusiness();
  };

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/businesses')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </button>
        <QueryError message={error} onRetry={fetchBusiness} />
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  if (!business) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Business not found.</p>
        <Link to="/businesses" className="text-primary underline mt-2 inline-block">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bizd-header mb-6">
        <button
          onClick={() => navigate('/businesses')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{business.name}</h1>
              <StatusBadge status={business.status} />
            </div>
            {business.industry && (
              <p className="text-muted-foreground mt-1">{business.industry}</p>
            )}
          </div>
          {!editing ? (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={saveEdits}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
              >
                <Save className="h-4 w-4" /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bizd-tabs border-b border-border mb-6">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <ErrorBoundary>
        <div className="bizd-tab-content">
          {activeTab === 'Overview' && (
            <OverviewTab business={business} editing={editing} editForm={editForm} setEditForm={setEditForm} />
          )}
          {activeTab === 'Activity' && (
            <div className="space-y-6">
              <ActivityForm
                businessId={business.id}
                onSave={createInteraction}
                onUpdate={(interactionId, updates) => updateInteraction(interactionId, updates)}
                editingInteraction={editingInteraction}
                onCancelEdit={() => setEditingInteraction(null)}
              />
              {interactionsError ? (
                <QueryError message={interactionsError} onRetry={refetchInteractions} />
              ) : interactionsLoading ? (
                <LoadingSpinner />
              ) : interactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No interactions yet. Log your first one above.
                </div>
              ) : (
                <Timeline
                  interactions={interactions}
                  onEdit={setEditingInteraction}
                  onDelete={deleteInteraction}
                />
              )}
            </div>
          )}
          {activeTab === 'Needs' && (
            <div className="space-y-6">
              <NeedForm
                businessId={business.id}
                onSave={createNeed}
                onUpdate={(needId, updates) => updateNeed(needId, updates)}
                editingNeed={editingNeed}
                onCancelEdit={() => setEditingNeed(null)}
              />
              {needsError ? (
                <QueryError message={needsError} onRetry={refetchNeeds} />
              ) : needsLoading ? (
                <LoadingSpinner />
              ) : needs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No needs identified yet. Add the first one above.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {needs.map(need => (
                    <NeedCard
                      key={need.id}
                      need={need}
                      onStatusChange={(needId, status) => updateNeed(needId, { status })}
                      onEdit={setEditingNeed}
                      onDelete={deleteNeed}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'Emails' && (
            <EmailTab business={business} needs={needs} />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}

function OverviewTab({
  business, editing, editForm, setEditForm,
}: {
  business: Business;
  editing: boolean;
  editForm: TablesUpdate<'businesses'>;
  setEditForm: React.Dispatch<React.SetStateAction<TablesUpdate<'businesses'>>>;
}) {
  const fields: { label: string; key: keyof Business; type?: string; required?: boolean }[] = [
    { label: 'Business Name', key: 'name', required: true },
    { label: 'Industry', key: 'industry' },
    { label: 'Contact Name', key: 'contact_name' },
    { label: 'Contact Title', key: 'contact_title' },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Phone', key: 'phone', type: 'tel' },
    { label: 'Address', key: 'address' },
    { label: 'City', key: 'city' },
    { label: 'State', key: 'state' },
    { label: 'ZIP', key: 'zip' },
    { label: 'Website', key: 'website' },
    { label: 'Source', key: 'source' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(({ label, key, type, required }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && editing && <span className="text-destructive ml-0.5">*</span>}</label>
          {editing ? (
            <input
              type={type || 'text'}
              value={(editForm[key] as string) ?? ''}
              onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
              required={required}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            />
          ) : (
            <p className="text-sm">{(business[key] as string) || '--'}</p>
          )}
        </div>
      ))}

      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
        {editing ? (
          <textarea
            value={(editForm.notes as string) ?? ''}
            onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-y"
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{business.notes || '--'}</p>
        )}
      </div>

      {business.tags && business.tags.length > 0 && (
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Tags</label>
          <div className="flex flex-wrap gap-1">
            {business.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
