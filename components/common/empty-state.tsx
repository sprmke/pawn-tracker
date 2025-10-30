import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
        <p className="text-muted-foreground mb-4 text-center">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick}>
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
