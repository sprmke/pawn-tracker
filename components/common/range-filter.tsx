import { Input } from '@/components/ui/input';
import { LucideIcon } from 'lucide-react';

interface RangeFilterProps {
  label: string;
  icon?: LucideIcon;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  type?: 'number' | 'text';
}

export function RangeFilter({
  label,
  icon: Icon,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
  type = 'number',
}: RangeFilterProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          type={type}
          placeholder={minPlaceholder}
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          className="h-9 text-sm"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type={type}
          placeholder={maxPlaceholder}
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
    </div>
  );
}
