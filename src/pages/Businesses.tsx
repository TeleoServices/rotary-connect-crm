import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Plus, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBusinesses, type Business } from '@/hooks/useBusinesses';
import { BusinessFilters } from '@/components/businesses/BusinessFilters';
import { StatusBadge } from '@/components/businesses/StatusBadge';
import { QuickAddBusiness } from '@/components/businesses/QuickAddBusiness';
import { CSVImport } from '@/components/businesses/CSVImport';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Businesses() {
  const navigate = useNavigate();
  const {
    businesses, loading, filters, setFilters,
    pagination, setPage,
    createBusiness, bulkInsert,
  } = useBusinesses();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const columns = useMemo<ColumnDef<Business>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded"
          onClick={e => e.stopPropagation()}
        />
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Business Name',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
      cell: ({ getValue }) => getValue<string>() || '--',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
    },
    {
      accessorKey: 'contact_name',
      header: 'Contact',
      cell: ({ getValue }) => getValue<string>() || '--',
    },
    {
      accessorKey: 'city',
      header: 'City',
      cell: ({ getValue }) => getValue<string>() || '--',
    },
    {
      accessorKey: 'updated_at',
      header: 'Last Updated',
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return val ? new Date(val).toLocaleDateString() : '--';
      },
    },
  ], []);

  const table = useReactTable({
    data: businesses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: Math.ceil(pagination.total / pagination.pageSize),
  });

  const exportCSV = () => {
    const headers = ['Name', 'Industry', 'Status', 'Contact', 'Email', 'Phone', 'City', 'State'];
    const csvRows = [
      headers.join(','),
      ...businesses.map(b =>
        [b.name, b.industry, b.status, b.contact_name, b.email, b.phone, b.city, b.state]
          .map(v => `"${(v || '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Business Directory</h1>
          <p className="text-sm text-muted-foreground">{pagination.total} businesses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Business
          </button>
          <button
            onClick={() => setCsvOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <BusinessFilters filters={filters} onFiltersChange={setFilters} />

      {loading ? (
        <LoadingSpinner />
      ) : businesses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg mb-2">No businesses found</p>
          <p className="text-sm">Add your first business or import from a CSV file.</p>
        </div>
      ) : (
        <>
          <div className="biz-table mt-4 border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id} className="border-b border-border bg-muted">
                    {hg.headers.map(header => (
                      <th key={header.id} className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-border hover:bg-accent/50 cursor-pointer"
                    onClick={() => navigate(`/businesses/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">
              Page {pagination.page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 0}
                className="flex items-center gap-1 px-3 py-1 border border-input rounded-md disabled:opacity-50 hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1 border border-input rounded-md disabled:opacity-50 hover:bg-accent"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <QuickAddBusiness
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSave={createBusiness}
      />

      <CSVImport
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImport={bulkInsert}
      />
    </div>
  );
}
