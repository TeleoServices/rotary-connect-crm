import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NEED_CATEGORIES, NEED_PRIORITIES, CATEGORY_LABELS, type NeedInsert, type BusinessNeed } from '@/hooks/useNeeds';

const EMPTY_FORM = {
  category: 'other' as string,
  description: '',
  priority: 'medium' as string,
};

interface Props {
  businessId: string;
  onSave: (need: NeedInsert) => Promise<unknown>;
  onUpdate?: (id: string, updates: Partial<NeedInsert>) => Promise<unknown>;
  editingNeed?: BusinessNeed | null;
  onCancelEdit?: () => void;
}

export function NeedForm({ businessId, onSave, onUpdate, editingNeed, onCancelEdit }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // When editingNeed changes, populate form
  useEffect(() => {
    if (editingNeed) {
      setForm({
        category: editingNeed.category,
        description: editingNeed.description,
        priority: editingNeed.priority || 'medium',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingNeed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingNeed && onUpdate) {
      await onUpdate(editingNeed.id, {
        category: form.category,
        description: form.description,
        priority: form.priority,
      });
    } else {
      await onSave({
        business_id: businessId,
        category: form.category,
        description: form.description,
        priority: form.priority,
        identified_by: user?.id,
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
    <form onSubmit={handleSubmit} className="need-form border border-border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">
          {editingNeed ? 'Edit Need' : 'Add a Need'}
        </h3>
        {editingNeed && (
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
          <label className="block text-xs font-medium mb-1">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            {NEED_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            {NEED_PRIORITIES.map(p => (
              <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          required
          placeholder="Describe the business need..."
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !form.description}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {editingNeed ? 'Update Need' : 'Save Need'}
      </button>
    </form>
  );
}
