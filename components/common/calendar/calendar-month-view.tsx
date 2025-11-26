'use client';

import { useState } from 'react';
import { CalendarCell, CalendarConfig } from './types';
import { DailySummary } from './daily-summary';
import { CalendarEventsModal } from './calendar-events-modal';
import { Button } from '@/components/ui/button';

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
  const [modalState, setModalState] = useState<{
    open: boolean;
    date: Date | null;
    events: any[];
  }>({
    open: false,
    date: null,
    events: [],
  });

  const MAX_VISIBLE_EVENTS = 1;

  const handleViewMore = (cell: CalendarCell) => {
    setModalState({
      open: true,
      date: cell.date,
      events: cell.events,
    });
  };

  const closeModal = () => {
    setModalState({
      open: false,
      date: null,
      events: [],
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-semibold border-r last:border-r-0"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="inline sm:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {cells.map((cell, index) => (
              <div
                key={index}
                className={`min-h-[140px] md:min-h-[160px] border-r border-b last:border-r-0 p-1.5 md:p-2 relative ${
                  !cell.isCurrentMonth ? 'bg-muted/30' : ''
                } ${isToday(cell.date) ? 'bg-primary/10' : ''}`}
              >
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <div
                    className={`text-xs md:text-sm font-medium ${
                      !cell.isCurrentMonth ? 'text-muted-foreground' : ''
                    } ${isToday(cell.date) ? 'text-primary font-bold' : ''}`}
                  >
                    {cell.date.getDate()}
                  </div>
                  {isToday(cell.date) && (
                    <span className="text-[8px] md:text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {/* Daily Summary */}
                  <DailySummary
                    events={cell.events}
                    formatCurrency={config.formatCurrency}
                    size="sm"
                    alwaysShow={config.alwaysShowSummary}
                    allEvents={config.allEvents}
                    currentDate={cell.date}
                  />

                  {/* Events - Only show limited number */}
                  {cell.events
                    .slice(0, MAX_VISIBLE_EVENTS)
                    .map((event, eventIndex) => (
                      <div key={eventIndex}>
                        {renderEventCard && renderEventCard(event, eventIndex)}
                      </div>
                    ))}

                  {/* View More Button */}
                  {cell.events.length > MAX_VISIBLE_EVENTS && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMore(cell)}
                      className="w-full text-xs py-1 h-6 hover:bg-primary/10"
                    >
                      +{cell.events.length - MAX_VISIBLE_EVENTS} more
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events Modal */}
      {modalState.date && (
        <CalendarEventsModal
          date={modalState.date}
          events={modalState.events}
          config={config}
          open={modalState.open}
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
        />
      )}
    </>
  );
}
