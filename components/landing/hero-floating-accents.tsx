import { ArrowDownLeft, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HeroFloatingAccents() {
  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute z-30',
          'top-[21%] -right-4 sm:-right-6 md:-right-8',
          'rotate-2 animate-float',
        )}
      >
        <div className="flex items-center gap-2.5 rounded-2xl border border-chart-2/25 bg-card/95 px-3.5 py-2.5 shadow-[var(--shadow-elevated-lg)] backdrop-blur-md">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-chart-2/15">
            <ArrowDownLeft className="h-4 w-4 text-chart-2" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground">
              Just collected
            </p>
            <p className="text-sm font-bold tabular-nums text-chart-2">
              +₱12,500
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'pointer-events-none absolute z-30',
          'top-[8%] -right-4 sm:-right-6 md:-right-8',
          'rotate-2 animate-float',
        )}
        style={{ animationDelay: '2.2s' }}
      >
        <div className="flex items-center gap-2.5 rounded-2xl border border-primary/25 bg-card/95 px-3.5 py-2.5 shadow-[var(--shadow-elevated-lg)] backdrop-blur-md">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12">
            <BellRing className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground">
              Due this week
            </p>
            <p className="text-sm font-bold text-foreground">3 loans</p>
          </div>
        </div>
      </div>
    </>
  );
}
