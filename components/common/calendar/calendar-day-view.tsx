'use client';

import { CalendarCell, CalendarConfig } from './types';
import { DailySummary } from './daily-summary';

interface CalendarDayViewProps {
  cells: CalendarCell[];
  config: CalendarConfig;
}

export function CalendarDayView({ cells, config }: CalendarDayViewProps) {
  const { formatCurrency, renderEventCard } = config;

  // Check if today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="p-3 md:p-6">
      {cells.map((cell, index) => (
        <div
          key={index}
          className={`space-y-3 ${
            isToday(cell.date) ? 'bg-primary/10 rounded-lg p-4' : ''
          }`}
        >
          {isToday(cell.date) && (
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1 rounded uppercase">
                Today
              </span>
            </div>
          )}

          {/* Daily Summary */}
          <DailySummary
            events={cell.events}
            formatCurrency={formatCurrency}
            size="lg"
          />

          {/* Events List */}
          <div className="space-y-2 md:space-y-3">
            {cell.events.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-muted-foreground text-sm md:text-base">
                No transactions on this day
              </div>
            ) : (
              cell.events.map((event, eventIndex) => (
                <div key={eventIndex}>
                  {renderEventCard && renderEventCard(event, eventIndex)}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
