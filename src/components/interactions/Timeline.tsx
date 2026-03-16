import { Phone, Mail, MapPin, Users, Calendar, StickyNote, MoreHorizontal } from 'lucide-react';
import type { Interaction } from '@/hooks/useInteractions';

const TYPE_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  visit: MapPin,
  meeting: Users,
  event: Calendar,
  note: StickyNote,
  other: MoreHorizontal,
};

const TYPE_COLORS: Record<string, string> = {
  call: 'bg-blue-100 text-blue-600',
  email: 'bg-green-100 text-green-600',
  visit: 'bg-purple-100 text-purple-600',
  meeting: 'bg-orange-100 text-orange-600',
  event: 'bg-pink-100 text-pink-600',
  note: 'bg-gray-100 text-gray-600',
  other: 'bg-gray-100 text-gray-600',
};

interface Props {
  interactions: Interaction[];
}

export function Timeline({ interactions }: Props) {
  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No interactions yet. Log your first one above.</p>
      </div>
    );
  }

  return (
    <div className="int-timeline space-y-4">
      {interactions.map((interaction) => {
        const Icon = TYPE_ICONS[interaction.type] || MoreHorizontal;
        const colorClass = TYPE_COLORS[interaction.type] || TYPE_COLORS.other;

        return (
          <div key={interaction.id} className="int-timeline-entry flex gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="int-type-badge text-xs font-medium capitalize">{interaction.type}</span>
                  {interaction.subject && (
                    <span className="text-sm font-medium ml-2">{interaction.subject}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(interaction.date).toLocaleDateString()}
                </span>
              </div>
              {interaction.notes && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{interaction.notes}</p>
              )}
              {interaction.outcome && (
                <p className="text-sm mt-1">
                  <span className="font-medium">Outcome:</span> {interaction.outcome}
                </p>
              )}
              {interaction.follow_up_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Follow-up: {new Date(interaction.follow_up_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
