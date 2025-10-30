'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CalendarEvent, CalendarConfig } from './types';
import { useCalendar } from './use-calendar';
import { CalendarHeader } from './calendar-header';
import { CalendarDayView } from './calendar-day-view';
import { CalendarWeekView } from './calendar-week-view';
import { CalendarMonthView } from './calendar-month-view';

interface CalendarProps {
  events: CalendarEvent[];
  config: CalendarConfig;
  showLegend?: boolean;
}

export function Calendar({ events, config, showLegend = true }: CalendarProps) {
  const {
    viewMode,
    setViewMode,
    calendarData,
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
    getViewTitle,
    dayNames,
    isToday,
  } = useCalendar({ events });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <CalendarHeader
        title={getViewTitle()}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToday={goToToday}
        onPrevious={goToPreviousPeriod}
        onNext={goToNextPeriod}
        showLegend={showLegend}
        legendGroups={config.legendGroups}
      />

      {/* Mobile Scroll Hint */}
      {(viewMode === 'week' || viewMode === 'month') && (
        <div className="md:hidden text-xs text-muted-foreground text-center py-1 bg-muted/30 rounded-lg">
          ← Swipe to scroll horizontally →
        </div>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {viewMode === 'day' && (
            <CalendarDayView cells={calendarData} config={config} />
          )}

          {viewMode === 'week' && (
            <CalendarWeekView
              cells={calendarData}
              config={config}
              dayNames={dayNames}
              isToday={isToday}
            />
          )}

          {viewMode === 'month' && (
            <CalendarMonthView
              cells={calendarData}
              config={config}
              dayNames={dayNames}
              isToday={isToday}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
