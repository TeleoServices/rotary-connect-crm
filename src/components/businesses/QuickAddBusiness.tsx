import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { BusinessInsert } from '@/hooks/useBusinesses';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (business: BusinessInsert) => Promise<unknown>;
}

const INITIAL: BusinessInsert = {
  name: '',
  industry: '',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  website: '',
  source: '',
  status: 'new',
};

export function QuickAddBusiness({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState<BusinessInsert>(INITIAL);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setForm(INITIAL);
    onClose();
  };

  const set = (field: keyof BusinessInsert, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="biz-quick-add fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Add Business</h2>
            <button onClick={onClose} className="p-1 hover:bg-accent rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Business Name *" value={form.name} onChange={v => set('name', v)} required />
            <Field label="Industry" value={form.industry || ''} onChange={v => set('industry', v)} />
            <Field label="Contact Name" value={form.contact_name || ''} onChange={v => set('contact_name', v)} />
            <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
            <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" />
            <Field label="Address" value={form.address || ''} onChange={v => set('address', v)} />
            <div className="grid grid-cols-3 gap-2">
              <Field label="City" value={form.city || ''} onChange={v => set('city', v)} />
              <Field label="State" value={form.state || ''} onChange={v => set('state', v)} />
              <Field label="ZIP" value={form.zip || ''} onChange={v => set('zip', v)} />
            </div>
            <Field label="Website" value={form.website || ''} onChange={v => set('website', v)} />
            <Field label="Source" value={form.source || ''} onChange={v => set('source', v)} placeholder="e.g., Google Maps, referral" />

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={saving || !form.name}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Business
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-input rounded-md hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function Field({
  label, value, onChange, type = 'text', required = false, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
