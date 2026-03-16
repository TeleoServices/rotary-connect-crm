import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/lib/types';
import { useInteractions } from '@/hooks/useInteractions';
import { StatusBadge } from '@/components/businesses/StatusBadge';
import { ActivityForm } from '@/components/interactions/ActivityForm';
import { Timeline } from '@/components/interactions/Timeline';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

type Business = Tables<'businesses'>;

const TABS = ['Overview', 'Activity', 'Needs', 'Emails'] as const;
type Tab = (typeof TABS)[number];

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<TablesUpdate<'businesses'>>({});

  const { interactions, loading: interactionsLoading, createInteraction } = useInteractions(id || '');

  const fetchBusiness = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[BusinessDetail] fetch:', error.message);
      setBusiness(null);
    } else {
      setBusiness(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBusiness();
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
              <ActivityForm businessId={business.id} onSave={createInteraction} />
              {interactionsLoading ? <LoadingSpinner /> : <Timeline interactions={interactions} />}
            </div>
          )}
          {activeTab === 'Needs' && (
            <div className="text-center py-8 text-muted-foreground">
              Needs tracking will be built in Milestone 4.
            </div>
          )}
          {activeTab === 'Emails' && (
            <div className="text-center py-8 text-muted-foreground">
              Email templates will be integrated in Milestone 5.
            </div>
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
  const fields: { label: string; key: keyof Business; type?: string }[] = [
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
      {fields.map(({ label, key, type }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
          {editing ? (
            <input
              type={type || 'text'}
              value={(editForm[key] as string) ?? ''}
              onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
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
