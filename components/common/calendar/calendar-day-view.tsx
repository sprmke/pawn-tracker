'use client';

import { CalendarCell, CalendarConfig } from './types';
import { DailySummary } from './daily-summary';

interface CalendarDayViewProps {
  cells: CalendarCell[];
  config: CalendarConfig;
}

export function CalendarDayView({ cells, config }: CalendarDayViewProps) {
  const { formatCurrency, renderEventCard } = config;

  return (
    <div className="p-6">
      {cells.map((cell, index) => (
        <div key={index} className="space-y-3">
          {/* Daily Summary */}
          <DailySummary
            events={cell.events}
            formatCurrency={formatCurrency}
            size="lg"
          />

          {/* Events List */}
          <div className="space-y-3">
            {cell.events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
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
