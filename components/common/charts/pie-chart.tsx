'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CustomTooltip } from './custom-tooltip';
import { PieChartIcon } from 'lucide-react';
import {
  ChartCard,
  ChartEmptyState,
  ChartPieLegend,
} from './chart-shell';
import { CHART_HEIGHT, DEFAULT_PIE_COLORS } from './chart-theme';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title: string;
  formatValue?: (value: number) => string;
  colors?: string[];
  emptyMessage?: string;
}

export function PieChart({
  data,
  title,
  formatValue = (value) => value.toString(),
  colors = [...DEFAULT_PIE_COLORS],
  emptyMessage,
}: PieChartProps) {
  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((item) => !item.value || item.value === 0);

  const total = data?.reduce((sum, item) => sum + item.value, 0) ?? 0;

  return (
    <ChartCard title={title}>
      {isEmpty ? (
        <ChartEmptyState
          icon={PieChartIcon}
          message={emptyMessage || 'No data available'}
        />
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="46%"
                innerRadius={62}
                outerRadius={92}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={3}
                cornerRadius={4}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
              <Legend content={<ChartPieLegend />} />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute left-1/2 top-[46%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </span>
            <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
              {formatValue(total)}
            </span>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
