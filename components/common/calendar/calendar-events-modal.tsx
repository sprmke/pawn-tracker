'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarEvent, CalendarConfig } from './types';
import { DailySummary } from './daily-summary';
import { format } from 'date-fns';

interface CalendarEventsModalProps {
  date: Date;
  events: CalendarEvent[];
  config: CalendarConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarEventsModal({
  date,
  events,
  config,
  open,
  onOpenChange,
}: CalendarEventsModalProps) {
  const { renderEventCard, formatCurrency } = config;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>Events for {format(date, 'MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>

        {/* Daily Summary - Always Visible */}
        <div className="px-6 flex-shrink-0">
          <DailySummary
            events={events}
            formatCurrency={formatCurrency}
            alwaysShow={config.alwaysShowSummary}
            allEvents={config.allEvents}
            currentDate={date}
          />
        </div>

        {/* Event List - Scrollable */}
        <div className="flex-1 overflow-hidden px-6 pb-6 flex flex-col">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex-shrink-0">
            All Events ({events.length})
          </h3>
          {events.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-2">
                {events.map((event, eventIndex) => (
                  <div key={eventIndex}>
                    {renderEventCard && renderEventCard(event, eventIndex)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No events for this day
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
