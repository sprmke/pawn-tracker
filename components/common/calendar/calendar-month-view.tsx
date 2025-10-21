'use client';

import { CalendarCell, CalendarConfig } from './types';
import { DailySummary } from './daily-summary';

interface CalendarMonthViewProps {
  cells: CalendarCell[];
  config: CalendarConfig;
  dayNames: string[];
  isToday: (date: Date) => boolean;
}

export function CalendarMonthView({
  cells,
  config,
  dayNames,
  isToday,
}: CalendarMonthViewProps) {
  const { renderEventCard } = config;

  return (
    <>
      {/* Day Names Header */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => (
          <div
            key={index}
            className={`min-h-[140px] border-r border-b last:border-r-0 p-2 ${
              !cell.isCurrentMonth ? 'bg-muted/30' : ''
            } ${isToday(cell.date) ? 'bg-primary/5' : ''}`}
          >
            <div
              className={`text-sm font-medium mb-2 ${
                !cell.isCurrentMonth ? 'text-muted-foreground' : ''
              } ${isToday(cell.date) ? 'text-primary font-bold' : ''}`}
            >
              {cell.date.getDate()}
            </div>

            <div className="space-y-1.5">
              {/* Daily Summary */}
              <DailySummary
                events={cell.events}
                formatCurrency={config.formatCurrency}
                size="sm"
              />

              {/* Events */}
              {cell.events.map((event, eventIndex) => (
                <div key={eventIndex}>
                  {renderEventCard && renderEventCard(event, eventIndex)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
