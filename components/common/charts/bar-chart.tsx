'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomTooltip } from './custom-tooltip';

interface BarChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  dataKeys: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  xAxisKey: string;
  formatValue?: (value: number) => string;
  layout?: 'horizontal' | 'vertical';
}

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-4 px-2">
      {payload.map((entry: any, index: number) => (
        <div
          key={`legend-${index}`}
          className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-full border border-border/50 hover:bg-muted/50 transition-colors"
        >
          <div
            className="w-3 h-2 rounded-sm flex-shrink-0 ring-2 ring-background"
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

export function BarChart({
  data,
  title,
  dataKeys,
  xAxisKey,
  formatValue = (value) => value.toString(),
  layout = 'horizontal',
}: BarChartProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={320}>
          <RechartsBarChart
            data={data}
            layout={layout}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            barGap={8}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
              vertical={false}
            />
            {layout === 'horizontal' ? (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={formatValue}
                  width={80}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={formatValue}
                  width={80}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
              </>
            )}
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} />}
              cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
            />
            <Legend content={<CustomLegend />} />
            {dataKeys.map((dataKey) => (
              <Bar
                key={dataKey.key}
                dataKey={dataKey.key}
                name={dataKey.label}
                fill={dataKey.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
