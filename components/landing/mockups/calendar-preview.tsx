import { BrowserFrame } from './browser-frame';
import { cn } from '@/lib/utils';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const cells: Array<{
  day: number;
  muted?: boolean;
  today?: boolean;
  events?: Array<{ label: string; tone: 'sent' | 'due' | 'interest' }>;
}> = [
  { day: 25, muted: true },
  { day: 26, muted: true },
  { day: 27, muted: true },
  { day: 28, muted: true },
  { day: 29, muted: true },
  { day: 30, muted: true },
  { day: 1 },
  { day: 2 },
  { day: 3, events: [{ label: 'Sent ₱180k', tone: 'sent' }] },
  { day: 4 },
  { day: 5, events: [{ label: 'Due ₱95k', tone: 'due' }] },
  { day: 6 },
  { day: 7 },
  { day: 8, today: true, events: [{ label: 'Interest due', tone: 'interest' }] },
  { day: 9 },
  { day: 10, events: [{ label: 'Sent ₱250k', tone: 'sent' }] },
  { day: 11 },
  { day: 12, events: [{ label: 'Due ₱420k', tone: 'due' }] },
  { day: 13 },
  { day: 14 },
  { day: 15 },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  { day: 24 },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
];

const toneClass = {
  sent: 'bg-info/15 text-info border-info/25',
  due: 'bg-chart-3/15 text-chart-3 border-chart-3/25',
  interest: 'bg-primary/12 text-primary border-primary/25',
};

export function CalendarPreview() {
  return (
    <BrowserFrame title="loans">
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Schedule
            </p>
            <h3 className="text-sm font-bold text-foreground">Loan Calendar</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Sent, due, and interest dates in one view
            </p>
          </div>
          <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
            <span className="rounded-lg bg-card px-2 py-1 text-[9px] font-semibold shadow-sm">
              Month
            </span>
            <span className="rounded-lg px-2 py-1 text-[9px] font-medium text-muted-foreground">
              Week
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/50">
          <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
            {dayNames.map((day) => (
              <div
                key={day}
                className="py-1.5 text-center text-[9px] font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, index) => (
              <div
                key={`${cell.day}-${index}`}
                className={cn(
                  'min-h-[3.25rem] border-b border-r border-border/30 p-1 last:border-r-0',
                  cell.muted && 'bg-muted/25',
                  cell.today && 'bg-primary/8',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-medium',
                    cell.today && 'bg-primary text-primary-foreground',
                    cell.muted && !cell.today && 'text-muted-foreground/60',
                  )}
                >
                  {cell.day}
                </span>
                {cell.events?.map((event) => (
                  <div
                    key={event.label}
                    className={cn(
                      'mt-0.5 truncate rounded border px-1 py-0.5 text-[7px] font-medium leading-tight',
                      toneClass[event.tone],
                    )}
                  >
                    {event.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-info" />
            Disbursement
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-chart-3" />
            Due date
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Interest due
          </span>
        </div>
      </div>
    </BrowserFrame>
  );
}
