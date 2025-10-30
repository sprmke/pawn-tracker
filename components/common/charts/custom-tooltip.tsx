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
    <div className="bg-background border border-border rounded-md shadow-lg p-3 min-w-[160px]">
      {label && (
        <p className="font-medium text-foreground mb-2 text-sm border-b border-border pb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground text-xs">
                {entry.name}
              </span>
            </div>
            <span className="font-semibold text-foreground text-xs">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
