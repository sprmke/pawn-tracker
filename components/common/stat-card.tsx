import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | ReactNode;
  icon?: LucideIcon;
  subtitle?: string | ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
  default: {
    border: 'border-t-4 border-t-primary',
    iconBg: 'bg-gradient-to-br from-primary/20 to-primary/10',
    iconColor: 'text-primary',
    gradient: 'bg-gradient-to-br from-primary/5 to-transparent',
  },
  primary: {
    border: 'border-t-4 border-t-primary',
    iconBg: 'bg-gradient-to-br from-primary/20 to-primary/10',
    iconColor: 'text-primary',
    gradient: 'bg-gradient-to-br from-primary/5 to-transparent',
  },
  success: {
    border: 'border-t-4 border-t-chart-2',
    iconBg: 'bg-gradient-to-br from-chart-2/20 to-chart-2/10',
    iconColor: 'text-chart-2',
    gradient: 'bg-gradient-to-br from-chart-2/5 to-transparent',
  },
  warning: {
    border: 'border-t-4 border-t-chart-3',
    iconBg: 'bg-gradient-to-br from-chart-3/20 to-chart-3/10',
    iconColor: 'text-chart-3',
    gradient: 'bg-gradient-to-br from-chart-3/5 to-transparent',
  },
  danger: {
    border: 'border-t-4 border-t-destructive',
    iconBg: 'bg-gradient-to-br from-destructive/20 to-destructive/10',
    iconColor: 'text-destructive',
    gradient: 'bg-gradient-to-br from-destructive/5 to-transparent',
  },
  info: {
    border: 'border-t-4 border-t-chart-4',
    iconBg: 'bg-gradient-to-br from-chart-4/20 to-chart-4/10',
    iconColor: 'text-chart-4',
    gradient: 'bg-gradient-to-br from-chart-4/5 to-transparent',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  className,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        'overflow-hidden group hover:-translate-y-0.5',
        styles.border,
        styles.gradient,
        className
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-base sm:text-lg font-semibold break-words">
              {value}
            </p>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 hidden sm:block',
                styles.iconBg
              )}
            >
              <Icon className={cn('h-6 w-6 flex-shrink-0', styles.iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
