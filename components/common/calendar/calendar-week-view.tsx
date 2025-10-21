'use client';

import { CalendarCell, CalendarConfig } from './types';
import { DailySummary } from './daily-summary';

interface CalendarWeekViewProps {
  cells: CalendarCell[];
  config: CalendarConfig;
  dayNames: string[];
  isToday: (date: Date) => boolean;
}

export function CalendarWeekView({
  cells,
  config,
  dayNames,
  isToday,
}: CalendarWeekViewProps) {
  const { renderEventCard } = config;

  return (
    <div>
      {/* Week Header */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {cells.map((cell, index) => (
          <div key={index} className="p-3 text-center border-r last:border-r-0">
            <div className="text-xs font-semibold text-muted-foreground">
              {dayNames[cell.date.getDay()]}
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                isToday(cell.date) ? 'text-primary' : ''
              }`}
            >
              {cell.date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Week Content */}
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => (
          <div
            key={index}
            className={`min-h-[500px] border-r last:border-r-0 p-2 ${
              !cell.isCurrentMonth ? 'bg-muted/30' : ''
            } ${isToday(cell.date) ? 'bg-primary/5' : ''}`}
          >
            <div className="space-y-2">
              {/* Daily Summary */}
              <DailySummary
                events={cell.events}
                formatCurrency={config.formatCurrency}
                size="sm"
              />

              {/* Events List */}
              {cell.events.map((event, eventIndex) => (
                <div key={eventIndex}>
                  {renderEventCard && renderEventCard(event, eventIndex)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
