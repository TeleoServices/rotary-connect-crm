import { INDUSTRIES } from '@/lib/industries';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IndustrySelect({ value, onChange, className = '' }: Props) {
  const isOther = value !== '' && !INDUSTRIES.includes(value as typeof INDUSTRIES[number]);

  return (
    <div className="space-y-2">
      <select
        value={isOther ? '__other__' : value}
        onChange={e => {
          const v = e.target.value;
          if (v === '__other__') {
            onChange(value && !INDUSTRIES.includes(value as typeof INDUSTRIES[number]) ? value : '');
          } else {
            onChange(v);
          }
        }}
        className={className || 'w-full py-2 px-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring'}
      >
        <option value="">-- Select Industry --</option>
        {INDUSTRIES.map(ind => (
          <option key={ind} value={ind}>{ind}</option>
        ))}
        <option value="__other__">Other...</option>
      </select>
      {isOther && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter industry"
          className={className || 'w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'}
        />
      )}
    </div>
  );
}
