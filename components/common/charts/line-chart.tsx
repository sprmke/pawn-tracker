'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomTooltip } from './custom-tooltip';
import { TrendingUp } from 'lucide-react';

interface LineChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  dataKeys: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  xAxisKey: string;
  formatValue?: (value: number) => string;
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

export function LineChart({
  data,
  title,
  dataKeys,
  xAxisKey,
  formatValue = (value) => value.toString(),
  emptyMessage,
}: LineChartProps) {
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
            <TrendingUp className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">
              {emptyMessage || 'No data available'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <RechartsLineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
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
              <Tooltip
                content={<CustomTooltip formatValue={formatValue} />}
                cursor={{
                  strokeWidth: 2,
                }}
              />
              <Legend content={<CustomLegend />} />
              {dataKeys.map((dataKey) => (
                <Line
                  key={dataKey.key}
                  type="monotone"
                  dataKey={dataKey.key}
                  name={dataKey.label}
                  stroke={dataKey.color}
                  strokeWidth={2.5}
                  dot={{
                    r: 3.5,
                    strokeWidth: 2,
                    fill: 'hsl(var(--background))',
                  }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
