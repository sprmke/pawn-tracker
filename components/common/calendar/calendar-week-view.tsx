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
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Week Header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {cells.map((cell, index) => (
            <div
              key={index}
              className={`p-2 md:p-3 text-center border-r last:border-r-0 ${
                isToday(cell.date) ? 'bg-primary/10' : ''
              }`}
            >
              <div className="text-xs font-semibold text-muted-foreground">
                <span className="hidden sm:inline">
                  {dayNames[cell.date.getDay()]}
                </span>
                <span className="inline sm:hidden">
                  {dayNames[cell.date.getDay()].slice(0, 3)}
                </span>
              </div>
              <div
                className={`text-xl md:text-2xl font-bold mt-1 ${
                  isToday(cell.date)
                    ? 'text-primary bg-primary/10 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto'
                    : ''
                }`}
              >
                {cell.date.getDate()}
              </div>
              {isToday(cell.date) && (
                <span className="text-[8px] md:text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase">
                  Today
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Week Content */}
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => (
            <div
              key={index}
              className={`min-h-[400px] md:min-h-[500px] border-r last:border-r-0 p-1.5 md:p-2 relative ${
                !cell.isCurrentMonth ? 'bg-muted/30' : ''
              } ${isToday(cell.date) ? 'bg-primary/10' : ''}`}
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
    </div>
  );
}
