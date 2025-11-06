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
    border: 'border-t-primary',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
  },
  primary: {
    border: 'border-t-primary',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
  },
  success: {
    border: 'border-t-success',
    iconBg: 'bg-emerald-400/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    border: 'border-t-warning',
    iconBg: 'bg-amber-300/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    border: 'border-t-danger',
    iconBg: 'bg-rose-400/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  info: {
    border: 'border-t-info',
    iconBg: 'bg-sky-400/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
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
      className={cn('border-t-2 overflow-hidden', styles.border, className)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-lg font-semibold break-words">{value}</p>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
          {Icon && (
            <div className={cn('rounded-md p-2', styles.iconBg)}>
              <Icon className={cn('h-5 w-5 flex-shrink-0', styles.iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
