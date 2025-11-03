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
import { BarChart3 } from 'lucide-react';

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
  emptyMessage?: string;
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
  emptyMessage,
}: BarChartProps) {
  // Check if data is empty or if all values are zero/null
  const isEmpty =
    !data ||
    data.length === 0 ||
    dataKeys.every((dataKey) =>
      data.every((item) => !item[dataKey.key] || item[dataKey.key] === 0)
    );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">
              {emptyMessage || 'No data available'}
            </p>
          </div>
        ) : (
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
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    dy={10}
                  />
                  <YAxis
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
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
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={formatValue}
                    width={80}
                  />
                  <YAxis
                    type="category"
                    dataKey={xAxisKey}
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
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
        )}
      </CardContent>
    </Card>
  );
}
