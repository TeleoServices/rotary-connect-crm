import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { CATEGORY_LABELS, PRIORITY_COLORS, type BusinessNeed } from '@/hooks/useNeeds';

interface Props {
  need: BusinessNeed;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (need: BusinessNeed) => void;
  onDelete?: (id: string) => Promise<boolean>;
}

export function NeedCard({ need, onStatusChange, onEdit, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const priorityClass = PRIORITY_COLORS[need.priority || 'medium'] || PRIORITY_COLORS.medium;

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(need.id);
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <div className="need-card border border-border rounded-lg p-3 bg-background shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {CATEGORY_LABELS[need.category] || need.category}
        </span>
        <div className="flex items-center gap-1">
          <span className={`need-priority-badge px-2 py-0.5 rounded-full text-xs font-medium ${priorityClass}`}>
            {need.priority}
          </span>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(need)}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Edit need: ${need.description.slice(0, 30)}`}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(!confirmDelete)}
              className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
              aria-label={`Delete need: ${need.description.slice(0, 30)}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm mb-2">{need.description}</p>
      {need.resolution && (
        <p className="text-xs text-muted-foreground mb-2">
          Resolution: {need.resolution}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{need.identified_date ? new Date(need.identified_date).toLocaleDateString() : ''}</span>
        {onStatusChange && (
          <select
            value={need.status || 'identified'}
            onChange={e => onStatusChange(need.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            className="px-2 py-1 border border-input rounded text-xs bg-background"
          >
            <option value="identified">Identified</option>
            <option value="researching">Researching</option>
            <option value="solution_proposed">Solution Proposed</option>
            <option value="resolved">Resolved</option>
            <option value="deferred">Deferred</option>
          </select>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded border border-red-200 bg-red-50 text-sm">
          <span className="text-red-700 text-xs">Delete this need?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="px-2 py-0.5 border border-red-300 text-red-700 rounded text-xs font-medium hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
