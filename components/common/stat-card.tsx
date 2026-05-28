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
    border: 'border-l-4 border-l-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    gradient: '',
  },
  primary: {
    border: 'border-l-4 border-l-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    gradient: '',
  },
  success: {
    border: 'border-l-4 border-l-chart-2',
    iconBg: 'bg-chart-2/10',
    iconColor: 'text-chart-2',
    gradient: '',
  },
  warning: {
    border: 'border-l-4 border-l-chart-5',
    iconBg: 'bg-chart-5/10',
    iconColor: 'text-chart-5',
    gradient: '',
  },
  danger: {
    border: 'border-l-4 border-l-destructive',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    gradient: '',
  },
  info: {
    border: 'border-l-4 border-l-chart-4',
    iconBg: 'bg-chart-4/10',
    iconColor: 'text-chart-4',
    gradient: '',
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
                'rounded-xl p-3 transition-transform duration-200 group-hover:scale-105 hidden sm:block',
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
