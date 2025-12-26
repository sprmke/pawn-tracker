import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-6">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
