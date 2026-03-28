import { useState } from 'react';
import { Phone, Mail, MapPin, Users, Calendar, StickyNote, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import type { Interaction } from '@/hooks/useInteractions';

const TYPE_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  visit: MapPin,
  meeting: Users,
  event: Calendar,
  note: StickyNote,
  other: MoreHorizontal,
};

const TYPE_COLORS: Record<string, string> = {
  call: 'bg-blue-100 text-blue-600',
  email: 'bg-green-100 text-green-600',
  visit: 'bg-purple-100 text-purple-600',
  meeting: 'bg-orange-100 text-orange-600',
  event: 'bg-pink-100 text-pink-600',
  note: 'bg-gray-100 text-gray-600',
  other: 'bg-gray-100 text-gray-600',
};

interface Props {
  interactions: Interaction[];
  onEdit?: (interaction: Interaction) => void;
  onDelete?: (id: string) => Promise<boolean>;
}

export function Timeline({ interactions, onEdit, onDelete }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No interactions yet. Log your first one above.</p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(id);
    setDeleting(false);
    setConfirmDeleteId(null);
  };

  return (
    <div className="int-timeline space-y-4">
      {interactions.map((interaction) => {
        const Icon = TYPE_ICONS[interaction.type] || MoreHorizontal;
        const colorClass = TYPE_COLORS[interaction.type] || TYPE_COLORS.other;
        const isConfirming = confirmDeleteId === interaction.id;

        return (
          <div key={interaction.id} className="int-timeline-entry flex gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="int-type-badge text-xs font-medium capitalize">{interaction.type}</span>
                  {interaction.subject && (
                    <span className="text-sm font-medium ml-2">{interaction.subject}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
                    {new Date(interaction.date).toLocaleDateString()}
                  </span>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(interaction)}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Edit interaction: ${interaction.subject || interaction.type}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(isConfirming ? null : interaction.id)}
                      className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      aria-label={`Delete interaction: ${interaction.subject || interaction.type}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {interaction.notes && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{interaction.notes}</p>
              )}
              {interaction.outcome && (
                <p className="text-sm mt-1">
                  <span className="font-medium">Outcome:</span> {interaction.outcome}
                </p>
              )}
              {interaction.follow_up_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Follow-up: {new Date(interaction.follow_up_date).toLocaleDateString()}
                </p>
              )}

              {/* Delete confirmation */}
              {isConfirming && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded border border-red-200 bg-red-50 text-sm">
                  <span className="text-red-700">Delete this interaction?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(interaction.id)}
                    disabled={deleting}
                    className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-0.5 border border-red-300 text-red-700 rounded text-xs font-medium hover:bg-red-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
