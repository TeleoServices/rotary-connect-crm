import { CATEGORY_LABELS, PRIORITY_COLORS, type BusinessNeed } from '@/hooks/useNeeds';

interface Props {
  need: BusinessNeed;
  onStatusChange?: (id: string, status: string) => void;
}

export function NeedCard({ need, onStatusChange }: Props) {
  const priorityClass = PRIORITY_COLORS[need.priority || 'medium'] || PRIORITY_COLORS.medium;

  return (
    <div className="need-card border border-border rounded-lg p-3 bg-background shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {CATEGORY_LABELS[need.category] || need.category}
        </span>
        <span className={`need-priority-badge px-2 py-0.5 rounded-full text-xs font-medium ${priorityClass}`}>
          {need.priority}
        </span>
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
    </div>
  );
}
