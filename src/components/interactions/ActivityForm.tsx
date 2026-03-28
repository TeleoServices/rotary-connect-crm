import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Interaction, InteractionInsert } from '@/hooks/useInteractions';

const INTERACTION_TYPES = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'visit', label: 'In-Person Visit' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'event', label: 'Event' },
  { value: 'note', label: 'Note' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  type: 'call',
  date: new Date().toISOString().split('T')[0],
  subject: '',
  notes: '',
  outcome: '',
  follow_up_date: '',
};

interface Props {
  businessId: string;
  onSave: (interaction: InteractionInsert) => Promise<unknown>;
  onUpdate?: (id: string, updates: Partial<InteractionInsert>) => Promise<unknown>;
  editingInteraction?: Interaction | null;
  onCancelEdit?: () => void;
}

export function ActivityForm({ businessId, onSave, onUpdate, editingInteraction, onCancelEdit }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // When editingInteraction changes, populate form
  useEffect(() => {
    if (editingInteraction) {
      setForm({
        type: editingInteraction.type,
        date: editingInteraction.date,
        subject: editingInteraction.subject || '',
        notes: editingInteraction.notes || '',
        outcome: editingInteraction.outcome || '',
        follow_up_date: editingInteraction.follow_up_date || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingInteraction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingInteraction && onUpdate) {
      await onUpdate(editingInteraction.id, {
        type: form.type,
        date: form.date,
        subject: form.subject || null,
        notes: form.notes || null,
        outcome: form.outcome || null,
        follow_up_date: form.follow_up_date || null,
      });
    } else {
      await onSave({
        business_id: businessId,
        user_id: user?.id,
        type: form.type,
        date: form.date,
        subject: form.subject || null,
        notes: form.notes || null,
        outcome: form.outcome || null,
        follow_up_date: form.follow_up_date || null,
      });
    }

    setSaving(false);
    setForm(EMPTY_FORM);
    onCancelEdit?.();
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    onCancelEdit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="int-form border border-border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">
          {editingInteraction ? 'Edit Interaction' : 'Log an Interaction'}
        </h3>
        {editingInteraction && (
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Cancel Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            {INTERACTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Subject</label>
        <input
          type="text"
          value={form.subject}
          onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Brief summary..."
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="Details of the interaction..."
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Outcome</label>
          <input
            type="text"
            value={form.outcome}
            onChange={e => setForm(prev => ({ ...prev, outcome: e.target.value }))}
            placeholder="e.g., Scheduled meeting, Left voicemail"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Follow-up Date</label>
          <input
            type="date"
            value={form.follow_up_date}
            onChange={e => setForm(prev => ({ ...prev, follow_up_date: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {editingInteraction ? 'Update Interaction' : 'Save Interaction'}
      </button>
    </form>
  );
}
