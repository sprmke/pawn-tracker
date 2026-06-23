import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityPanelSkeleton } from './page-skeletons';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/format';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ActivityPanelCardProps {
  title: string;
  count?: number;
  icon: LucideIcon;
  accentClassName: string;
  iconClassName: string;
  stripeClassName?: string;
  loading?: boolean;
  loadingVariant?: 'empty' | 'list';
  onViewAllClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function ActivityPanelCard({
  title,
  count = 0,
  icon: Icon,
  accentClassName,
  iconClassName,
  stripeClassName = 'bg-primary',
  loading = false,
  loadingVariant = 'empty',
  onViewAllClick,
  children,
  className,
}: ActivityPanelCardProps) {
  if (loading) {
    return <ActivityPanelSkeleton variant={loadingVariant} />;
  }

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col overflow-hidden border-border/40',
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 rounded-t-3xl',
          stripeClassName,
        )}
      />
      <CardHeader className="pb-2 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="text-sm font-semibold leading-tight">
                {title}
              </CardTitle>
              {count > 0 && (
                <button
                  type="button"
                  onClick={onViewAllClick}
                  className={cn(
                    'rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors',
                    onViewAllClick &&
                      'hover:bg-primary/10 hover:text-primary cursor-pointer',
                  )}
                  title={`View all ${title.toLowerCase()}`}
                >
                  {formatCount(count)}
                </button>
              )}
            </div>
          </div>
          <div className={cn('icon-well-sm shadow-sm', accentClassName)}>
            <Icon className={cn('h-4 w-4', iconClassName)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 flex-1 px-5 pb-5 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

export function ActivityListItem({
  className,
  children,
  onClick,
  href,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const itemClassName = cn(
    'flex flex-col gap-2 rounded-2xl border border-border/50 bg-muted/30 p-3.5 transition-all duration-200',
    'hover:border-primary/20 hover:bg-background hover:shadow-[var(--shadow-elevated)]',
    (onClick || href) && 'cursor-pointer',
    className,
  );

  if (href) {
    return (
      <a href={href} className={itemClassName}>
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(itemClassName, 'w-full text-left')}
      >
        {children}
      </button>
    );
  }

  return <div className={itemClassName}>{children}</div>;
}

export function ActivityEmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state-well">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export const activityItemClassName =
  'flex w-full min-w-0 flex-col gap-2 overflow-hidden rounded-2xl border border-border/50 bg-muted/30 p-3 transition-all duration-200 hover:border-primary/20 hover:bg-background hover:shadow-[var(--shadow-elevated)] cursor-pointer';

export const activityListScrollClassName =
  'max-h-[280px] space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5';

/** Shared row layout for loan/activity list items in narrow columns */
export function ActivityListRow({
  title,
  amount,
  amountClassName,
  badge,
  footer,
}: {
  title: string;
  amount: string;
  amountClassName?: string;
  badge: ReactNode;
  footer: ReactNode;
}) {
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-0.5">
        <p className="min-w-0 text-sm font-semibold leading-snug line-clamp-2 text-left">
          {title}
        </p>
        <p
          className={cn(
            'text-right text-sm font-bold tabular-nums whitespace-nowrap',
            amountClassName,
          )}
        >
          {amount}
        </p>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 shrink">{badge}</div>
        <div className="shrink-0 text-right">{footer}</div>
      </div>
    </>
  );
}
