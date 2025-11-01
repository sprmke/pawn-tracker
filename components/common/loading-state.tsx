import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'minimal' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
}

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="relative inline-flex">
      {/* Outer ring */}
      <div
        className={cn(
          'rounded-full border-2 border-primary/20',
          sizeClasses[size]
        )}
      />
      {/* Spinning ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin',
          sizeClasses[size]
        )}
      />
    </div>
  );
}

export function LoadingState({
  title = 'Loading...',
  description,
  variant = 'default',
  size = 'md',
}: LoadingStateProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <Spinner size={size} />
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-lg border">
          <Spinner size="lg" />
          <div className="text-center">
            <p className="text-lg font-medium">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {description && (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Spinner size={size} />
          <p className="text-muted-foreground">{title}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple inline loader for buttons and small spaces
export function InlineLoader({
  className,
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Spinner size={size} />
    </div>
  );
}
