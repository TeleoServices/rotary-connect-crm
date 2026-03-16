import { NeedCard } from './NeedCard';
import { STATUS_LABELS, type BusinessNeed } from '@/hooks/useNeeds';

const KANBAN_STATUSES = ['identified', 'researching', 'solution_proposed', 'resolved', 'deferred'];

interface Props {
  needs: BusinessNeed[];
  onStatusChange: (id: string, status: string) => void;
}

export function KanbanBoard({ needs, onStatusChange }: Props) {
  return (
    <div className="need-kanban flex gap-4 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map(status => {
        const columnNeeds = needs.filter(n => (n.status || 'identified') === status);
        return (
          <div key={status} className="flex-shrink-0 w-64">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-medium">{STATUS_LABELS[status]}</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {columnNeeds.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
              {columnNeeds.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No needs</p>
              ) : (
                columnNeeds.map(need => (
                  <NeedCard key={need.id} need={need} onStatusChange={onStatusChange} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
