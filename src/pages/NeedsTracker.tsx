import { useState, useMemo } from 'react';
import { Download, LayoutGrid, List } from 'lucide-react';
import { useNeeds, NEED_CATEGORIES, NEED_PRIORITIES, CATEGORY_LABELS, PRIORITY_COLORS, STATUS_LABELS, type NeedFilters } from '@/hooks/useNeeds';
import { KanbanBoard } from '@/components/needs/KanbanBoard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function NeedsTracker() {
  const [filters, setFilters] = useState<NeedFilters>({});
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const { needs, loading, updateNeed } = useNeeds(filters);

  const handleStatusChange = async (id: string, status: string) => {
    await updateNeed(id, {
      status,
      ...(status === 'resolved' ? { resolved_date: new Date().toISOString().split('T')[0] } : {}),
    });
  };

  // Aggregate stats
  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const need of needs) {
      byCategory[need.category] = (byCategory[need.category] || 0) + 1;
      const p = need.priority || 'medium';
      byPriority[p] = (byPriority[p] || 0) + 1;
    }
    return { byCategory, byPriority };
  }, [needs]);

  const exportCSV = () => {
    const headers = ['Category', 'Description', 'Priority', 'Status', 'Identified Date'];
    const csvRows = [
      headers.join(','),
      ...needs.map(n =>
        [n.category, n.description, n.priority, n.status, n.identified_date]
          .map(v => `"${(v || '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `needs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Needs Tracker</h1>
          <p className="text-sm text-muted-foreground">{needs.length} needs across all businesses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === 'kanban' ? 'table' : 'kanban')}
            className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            {view === 'kanban' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            {view === 'kanban' ? 'Table View' : 'Kanban View'}
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={filters.category || ''}
          onChange={e => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="">All Categories</option>
          {NEED_CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <select
          value={filters.priority || ''}
          onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value || undefined }))}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="">All Priorities</option>
          {NEED_PRIORITIES.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {NEED_PRIORITIES.map(p => (
          <div key={p} className="border border-border rounded-lg p-3">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${PRIORITY_COLORS[p]}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </span>
            <p className="text-2xl font-bold">{stats.byPriority[p] || 0}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : needs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg mb-2">No needs tracked yet</p>
          <p className="text-sm">Add needs from individual business detail pages.</p>
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard needs={needs} onStatusChange={handleStatusChange} />
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {needs.map(need => (
                <tr key={need.id} className="border-b border-border hover:bg-accent/50">
                  <td className="px-4 py-3">{CATEGORY_LABELS[need.category] || need.category}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{need.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[need.priority || 'medium']}`}>
                      {need.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={need.status || 'identified'}
                      onChange={e => handleStatusChange(need.id, e.target.value)}
                      className="px-2 py-1 border border-input rounded text-xs bg-background"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {need.identified_date ? new Date(need.identified_date).toLocaleDateString() : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
