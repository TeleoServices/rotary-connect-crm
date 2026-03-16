import { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { sanitizeCSVField } from '@/lib/sanitize';
import type { BusinessInsert } from '@/hooks/useBusinesses';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (rows: BusinessInsert[]) => Promise<number>;
}

const FIELD_OPTIONS: { value: keyof BusinessInsert | ''; label: string }[] = [
  { value: '', label: '-- Skip --' },
  { value: 'name', label: 'Business Name' },
  { value: 'industry', label: 'Industry' },
  { value: 'contact_name', label: 'Contact Name' },
  { value: 'contact_title', label: 'Contact Title' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip', label: 'ZIP' },
  { value: 'website', label: 'Website' },
  { value: 'source', label: 'Source' },
];

function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function CSVImport({ open, onClose, onImport }: Props) {
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<number, keyof BusinessInsert | ''>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) return;

      setHeaders(parsed[0]);
      setRows(parsed.slice(1));
      setResult(null);

      // Auto-map headers by name matching
      const autoMap: Record<number, keyof BusinessInsert | ''> = {};
      parsed[0].forEach((header, i) => {
        const h = header.toLowerCase().replace(/[^a-z]/g, '');
        const match = FIELD_OPTIONS.find(f =>
          f.value && f.value.toLowerCase().replace(/_/g, '') === h
        );
        if (match) autoMap[i] = match.value as keyof BusinessInsert;
      });
      setMapping(autoMap);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    const businessRows: BusinessInsert[] = rows
      .map(row => {
        const biz: Record<string, string> = {};
        Object.entries(mapping).forEach(([colIdx, field]) => {
          if (field && row[Number(colIdx)]) {
            biz[field] = sanitizeCSVField(row[Number(colIdx)]);
          }
        });
        return biz as unknown as BusinessInsert;
      })
      .filter(b => b.name);

    const count = await onImport(businessRows);
    setImporting(false);
    setResult(count);
  };

  const nameColMapped = Object.values(mapping).includes('name');

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-4 md:inset-10 bg-background border border-border rounded-lg z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Import Businesses from CSV</h2>
            <button onClick={onClose} className="p-1 hover:bg-accent rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {result !== null ? (
            <div className="text-center py-10">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Imported {result} businesses</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
                Done
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Select a CSV file to import</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv"
                onChange={handleFile}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Choose File
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {rows.length} rows found. Map columns to fields:
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border border-border">
                  <thead>
                    <tr className="bg-muted">
                      {headers.map((h, i) => (
                        <th key={i} className="p-2 border-b border-border text-left">
                          <div className="font-medium mb-1">{h}</div>
                          <select
                            value={mapping[i] || ''}
                            onChange={e => setMapping(prev => ({ ...prev, [i]: e.target.value as keyof BusinessInsert | '' }))}
                            className="w-full px-2 py-1 border border-input rounded text-xs bg-background"
                          >
                            {FIELD_OPTIONS.map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-border">
                        {row.map((cell, j) => (
                          <td key={j} className="p-2 text-xs truncate max-w-[150px]">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > 3 && (
                <p className="text-xs text-muted-foreground mb-4">
                  Showing 3 of {rows.length} rows
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={importing || !nameColMapped}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Import {rows.length} Rows
                </button>
                {!nameColMapped && (
                  <p className="text-sm text-destructive self-center">
                    Map at least the "Business Name" column
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
