const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  engaged: 'bg-purple-100 text-purple-800',
  needs_identified: 'bg-orange-100 text-orange-800',
  partner: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  dormant: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  engaged: 'Engaged',
  needs_identified: 'Needs Identified',
  partner: 'Partner',
  declined: 'Declined',
  dormant: 'Dormant',
};

export function StatusBadge({ status }: { status: string | null }) {
  const s = status || 'new';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s] || STATUS_COLORS.new}`}>
      {STATUS_LABELS[s] || s}
    </span>
  );
}
