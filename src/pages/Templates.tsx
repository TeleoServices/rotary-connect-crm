import { useState } from 'react';
import { Copy, Check, Edit2, Save, X } from 'lucide-react';
import { useTemplates, TYPE_LABELS, TYPE_GROUPS, renderMergeFields, ALL_MERGE_FIELDS, type Template } from '@/hooks/useTemplates';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QueryError } from '@/components/common/QueryError';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const SAMPLE_DATA: Record<string, string> = {
  '{{contact_name}}': 'Jane Smith',
  '{{business_name}}': 'Acme Corp',
  '{{rotary_member_name}}': 'John Doe',
  '{{rotary_club_name}}': 'Rotary Club of Springfield',
  '{{specific_need}}': 'workforce training and development',
  '{{city}}': 'Springfield',
  '{{state}}': 'IL',
  '{{email}}': 'jane@acmecorp.com',
  '{{phone}}': '(555) 123-4567',
  '{{industry}}': 'Manufacturing',
};

export default function Templates() {
  const { templates, loading, error, updateTemplate, refetch } = useTemplates();
  const [selected, setSelected] = useState<Template | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSelect = (template: Template) => {
    setSelected(template);
    setEditing(false);
    setShowPreview(false);
    setCopied(false);
  };

  const startEditing = () => {
    if (!selected) return;
    setEditBody(selected.body);
    setEditSubject(selected.subject || '');
    setEditing(true);
  };

  const saveEditing = async () => {
    if (!selected) return;
    await updateTemplate(selected.id, {
      body: editBody,
      subject: editSubject || null,
    });
    setSelected({ ...selected, body: editBody, subject: editSubject });
    setEditing(false);
  };

  const insertMergeField = (field: string) => {
    setEditBody(prev => prev + field);
  };

  const copyToClipboard = async () => {
    if (!selected) return;
    const rendered = renderMergeFields(selected.body, SAMPLE_DATA);
    await navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) return <QueryError message={error} onRetry={refetch} />;
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Templates & Scripts</h1>
          <p className="text-sm text-muted-foreground">{templates.length} templates</p>
        </div>
      </div>

      <ErrorBoundary>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="tpl-list space-y-4">
          {Object.entries(TYPE_GROUPS).map(([group, types]) => {
            const groupTemplates = templates.filter(t => types.includes(t.type));
            if (groupTemplates.length === 0) return null;
            return (
              <div key={group}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{group}</h3>
                <div className="space-y-1">
                  {groupTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelect(t)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selected?.id === t.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Template Editor / Preview */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="text-center py-20 text-muted-foreground border border-border rounded-lg">
              <p>Select a template to view or edit</p>
            </div>
          ) : (
            <div className="tpl-editor border border-border rounded-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="font-bold">{selected.name}</h2>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[selected.type] || selected.type}</p>
                </div>
                <div className="flex gap-2">
                  {!editing ? (
                    <>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="px-3 py-1 text-sm border border-input rounded-md hover:bg-accent"
                      >
                        {showPreview ? 'Source' : 'Preview'}
                      </button>
                      <button
                        onClick={startEditing}
                        className="flex items-center gap-1 px-3 py-1 text-sm border border-input rounded-md hover:bg-accent"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={saveEditing}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md"
                      >
                        <Save className="h-3 w-3" /> Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-1 px-3 py-1 text-sm border border-input rounded-md hover:bg-accent"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Subject line */}
              {(selected.subject || editing) && (
                <div className="px-4 py-2 border-b border-border bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Subject: </span>
                  {editing ? (
                    <input
                      value={editSubject}
                      onChange={e => setEditSubject(e.target.value)}
                      className="w-full mt-1 px-2 py-1 border border-input rounded text-sm bg-background"
                    />
                  ) : (
                    <span className="text-sm">
                      {showPreview
                        ? renderMergeFields(selected.subject || '', SAMPLE_DATA)
                        : selected.subject}
                    </span>
                  )}
                </div>
              )}

              {/* Merge field toolbar (editing only) */}
              {editing && (
                <div className="tpl-merge-toolbar px-4 py-2 border-b border-border bg-muted/30 flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-2 self-center">Insert:</span>
                  {ALL_MERGE_FIELDS.map(({ field, label }) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => insertMergeField(field)}
                      className="px-2 py-0.5 text-xs border border-input rounded bg-background hover:bg-accent"
                      title={label}
                    >
                      {field}
                    </button>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="tpl-preview p-4">
                {editing ? (
                  <textarea
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm font-mono resize-y"
                  />
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {showPreview
                      ? renderMergeFields(selected.body, SAMPLE_DATA)
                      : selected.body}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </ErrorBoundary>
    </div>
  );
}
