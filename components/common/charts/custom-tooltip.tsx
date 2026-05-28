'use client';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  formatValue?: (value: number) => string;
}

export function CustomTooltip({
  active,
  payload,
  label,
  formatValue = (value) => value.toString(),
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="min-w-[168px] rounded-2xl border border-border/50 bg-card/95 p-3.5 shadow-[var(--shadow-elevated-lg)] backdrop-blur-sm">
      {label && (
        <p className="mb-2 border-b border-border/50 pb-2 text-xs font-semibold text-foreground">
          {label}
        </p>
      )}
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
