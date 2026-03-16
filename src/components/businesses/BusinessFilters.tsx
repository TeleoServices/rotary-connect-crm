import { Search, X } from 'lucide-react';
import type { BusinessFilters as Filters } from '@/hooks/useBusinesses';

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'needs_identified', label: 'Needs Identified' },
  { value: 'partner', label: 'Partner' },
  { value: 'declined', label: 'Declined' },
  { value: 'dormant', label: 'Dormant' },
];

interface Props {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function BusinessFilters({ filters, onFiltersChange }: Props) {
  const hasActiveFilters = filters.search || filters.status || filters.industry;

  return (
    <div className="biz-filter-sidebar space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search businesses..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status || ''}
        onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
        className="w-full py-2 px-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => onFiltersChange({})}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
