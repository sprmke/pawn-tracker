import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

const APP_BASE_URL = 'pawn-tracker.vercel.app';

function previewUrl(path: string) {
  if (path === 'PawnTracker') return `${APP_BASE_URL}/`;
  return `${APP_BASE_URL}/${path}`;
}

interface BrowserFrameProps {
  children: ReactNode;
  title?: string;
  className?: string;
  glow?: boolean;
}

export function BrowserFrame({
  children,
  title = 'PawnTracker',
  className,
  glow = false,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.25rem] border border-border/60 bg-card shadow-[var(--shadow-elevated-lg)]',
        glow &&
          'before:absolute before:inset-0 before:-z-10 before:rounded-[1.35rem] before:bg-gradient-to-br before:from-primary/30 before:via-chart-5/20 before:to-transparent before:blur-2xl',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-chart-3/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-chart-5/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-chart-2/80" />
        </div>
        <div className="mx-auto flex h-7 min-w-0 max-w-[min(100%,380px)] flex-1 items-center justify-center rounded-lg bg-background/80 px-3 text-[10px] font-medium text-muted-foreground">
          <span className="truncate">{previewUrl(title)}</span>
        </div>
      </div>
      <div className="overflow-hidden bg-background">{children}</div>
    </div>
  );
}
