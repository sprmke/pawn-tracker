import { Button } from '@/components/ui/button';
import { LayoutGrid, Table as TableIcon, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'table' | 'calendar';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showCalendar?: boolean;
  hasData?: boolean;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  showCalendar = false,
  hasData = true,
}: ViewModeToggleProps) {
  const modes: Array<{ id: ViewMode; icon: typeof TableIcon; label: string; hidden?: boolean }> = [
    { id: 'table', icon: TableIcon, label: 'Table', hidden: true },
    { id: 'cards', icon: LayoutGrid, label: 'Cards' },
    ...(showCalendar ? [{ id: 'calendar' as ViewMode, icon: CalendarDays, label: 'Calendar' }] : []),
  ];

  return (
    <div className="pill-segment">
      {modes.map(({ id, icon: Icon, label, hidden }) => (
        <Button
          key={id}
          variant={viewMode === id ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => hasData && onViewModeChange(id)}
          className={cn(
            'h-8 rounded-xl px-3',
            hidden && 'hidden md:flex',
            viewMode === id && 'shadow-sm'
          )}
          title={`${label} view`}
          disabled={!hasData}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
