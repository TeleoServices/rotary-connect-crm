import { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTemplates, TYPE_LABELS, renderMergeFields } from '@/hooks/useTemplates';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QueryError } from '@/components/common/QueryError';
import type { Tables } from '@/lib/types';

type Business = Tables<'businesses'>;
type BusinessNeed = Tables<'business_needs'>;

/** Only email template types — no scripts */
const EMAIL_TYPES = ['email_initial', 'email_followup', 'email_thankyou'];

interface Props {
  business: Business;
  needs: BusinessNeed[];
}

export function EmailTab({ business, needs }: Props) {
  const { profile } = useAuth();
  const { templates, loading, error, refetch } = useTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter to email templates only
  const emailTemplates = useMemo(
    () => templates.filter(t => EMAIL_TYPES.includes(t.type)),
    [templates]
  );

  const selected = useMemo(
    () => emailTemplates.find(t => t.id === selectedId) ?? null,
    [emailTemplates, selectedId]
  );

  // Build merge data from business + auth profile + needs
  const mergeData = useMemo<Record<string, string>>(() => {
    const needsList = needs
      .filter(n => n.status !== 'resolved' && n.status !== 'deferred')
      .map(n => n.description)
      .slice(0, 3);

    const needsText = needsList.length > 0
      ? needsList.join('; ')
      : 'business growth and development';

    return {
      '{{business_name}}': business.name || '',
      '{{contact_name}}': business.contact_name || 'there',
      '{{rotary_member_name}}': profile?.full_name || '',
      '{{rotary_member_phone}}': profile?.phone || '',
      '{{rotary_club_name}}': 'Rotary Club',
      '{{specific_need}}': needsText,
    };
  }, [business, profile, needs]);

  // Check for missing data
  const missingFields: string[] = [];
  if (!business.contact_name) missingFields.push('contact name');
  if (!business.email) missingFields.push('email');

  // Rendered subject and body
  const renderedSubject = selected?.subject
    ? renderMergeFields(selected.subject, mergeData)
    : '';
  const renderedBody = selected
    ? renderMergeFields(selected.body, mergeData)
    : '';

  const handleCopy = async () => {
    const text = renderedSubject
      ? `Subject: ${renderedSubject}\n\n${renderedBody}`
      : renderedBody;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailto = () => {
    const to = business.email || '';
    const subject = encodeURIComponent(renderedSubject);
    const body = encodeURIComponent(renderedBody);
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');
  };

  if (error) return <QueryError message={error} onRetry={refetch} />;
  if (loading) return <LoadingSpinner />;

  if (emailTemplates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg mb-2">No email templates found</p>
        <p className="text-sm">Create email templates on the Templates page first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Missing data warning */}
      {missingFields.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Some fields are incomplete — edit the business to fill in{' '}
            <strong>{missingFields.join(' and ')}</strong> for best results.
          </p>
        </div>
      )}

      {/* Template selector */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Choose a template</label>
        <select
          value={selectedId || ''}
          onChange={e => {
            setSelectedId(e.target.value || null);
            setCopied(false);
          }}
          className="w-full sm:w-auto px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="">Select an email template...</option>
          {emailTemplates.map(t => (
            <option key={t.id} value={t.id}>
              {TYPE_LABELS[t.type] || t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Preview */}
      {selected && (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Header with template name */}
          <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{TYPE_LABELS[selected.type]}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-input rounded-md hover:bg-accent transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleMailto}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Email
              </button>
            </div>
          </div>

          {/* To line */}
          <div className="px-4 py-2 border-b border-border text-sm">
            <span className="text-xs font-medium text-muted-foreground mr-2">To:</span>
            <span>{business.email || <span className="italic text-muted-foreground">no email on file</span>}</span>
          </div>

          {/* Subject line */}
          {renderedSubject && (
            <div className="px-4 py-2 border-b border-border text-sm">
              <span className="text-xs font-medium text-muted-foreground mr-2">Subject:</span>
              <span>{renderedSubject}</span>
            </div>
          )}

          {/* Body */}
          <div className="px-4 py-4">
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{renderedBody}</pre>
          </div>
        </div>
      )}

      {/* Empty state when no template selected */}
      {!selected && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
          <p className="text-sm">Select a template above to preview with this business's data</p>
        </div>
      )}
    </div>
  );
}
