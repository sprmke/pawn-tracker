'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomTooltip } from './custom-tooltip';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title: string;
  formatValue?: (value: number) => string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#5986f9', // Pastel Blue
  '#34d399', // Pastel Emerald
  '#fb7185', // Pastel Rose
  '#fcd34d', // Pastel Amber
  '#a78bfa', // Pastel Violet
  '#f9a8d4', // Pastel Pink
  '#5eead4', // Pastel Teal
  '#fb923c', // Pastel Orange
];

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-4 px-2">
      {payload.map((entry: any, index: number) => (
        <div
          key={`legend-${index}`}
          className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-full border border-border/50 hover:bg-muted/50 transition-colors"
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-background"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium text-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for slices < 5%

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PieChart({
  data,
  title,
  formatValue = (value) => value.toString(),
  colors = DEFAULT_COLORS,
}: PieChartProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={320}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              label={renderCustomLabel}
              outerRadius={90}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colors[index % colors.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
            <Legend content={<CustomLegend />} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
