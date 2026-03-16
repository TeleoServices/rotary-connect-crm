import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NEED_CATEGORIES, NEED_PRIORITIES, CATEGORY_LABELS, type NeedInsert } from '@/hooks/useNeeds';

interface Props {
  businessId: string;
  onSave: (need: NeedInsert) => Promise<unknown>;
}

export function NeedForm({ businessId, onSave }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: 'other' as string,
    description: '',
    priority: 'medium' as string,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      business_id: businessId,
      category: form.category,
      description: form.description,
      priority: form.priority,
      identified_by: user?.id,
    });
    setSaving(false);
    setForm({ category: 'other', description: '', priority: 'medium' });
  };

  return (
    <form onSubmit={handleSubmit} className="need-form border border-border rounded-lg p-4 space-y-3 bg-muted/30">
      <h3 className="font-medium text-sm">Add a Need</h3>

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
        Save Need
      </button>
    </form>
  );
}
