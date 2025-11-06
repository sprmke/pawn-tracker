import { Button } from '@/components/ui/button';
import { LayoutGrid, Table as TableIcon, CalendarDays } from 'lucide-react';

type ViewMode = 'cards' | 'table' | 'calendar';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showCalendar?: boolean;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  showCalendar = false,
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center border rounded-lg p-1">
      <Button
        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="h-8 px-3"
        title="Table View"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('cards')}
        className="h-8 px-3"
        title="Card View"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      {showCalendar && (
        <Button
          variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('calendar')}
          className="h-8 px-3"
          title="Calendar View"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
