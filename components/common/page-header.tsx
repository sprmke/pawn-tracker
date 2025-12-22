import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
