'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { CustomTooltip } from './custom-tooltip';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

type TimePeriod = 'day' | 'week' | 'month';

interface CashflowData {
  label: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface CashflowTrendChartProps {
  dailyData: CashflowData[];
  weeklyData: CashflowData[];
  monthlyData: CashflowData[];
  title?: string;
  emptyMessage?: string;
}

const dataKeys = [
  { key: 'inflow', label: 'Inflow', color: '#34d399' }, // Pastel Emerald
  { key: 'outflow', label: 'Outflow', color: '#fcd34d' }, // Pastel Amber
  { key: 'net', label: 'Net', color: '#5986f9' }, // Pastel Blue
];

const periodLabels: Record<TimePeriod, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
};

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

export function CashflowTrendChart({
  dailyData,
  weeklyData,
  monthlyData,
  title = 'Cashflow Trend',
  emptyMessage = 'No cashflow data',
}: CashflowTrendChartProps) {
  const [period, setPeriod] = useState<TimePeriod>('week');

  const dataMap: Record<TimePeriod, CashflowData[]> = {
    day: dailyData,
    week: weeklyData,
    month: monthlyData,
  };

  const data = dataMap[period];

  // Check if data is empty or if all values are zero/null
  const isEmpty =
    !data ||
    data.length === 0 ||
    dataKeys.every((dataKey) =>
      data.every(
        (item) =>
          !item[dataKey.key as keyof CashflowData] ||
          item[dataKey.key as keyof CashflowData] === 0
      )
    );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center border rounded-lg p-1 self-start">
            {(['day', 'week', 'month'] as TimePeriod[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="h-7 px-3 text-xs"
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
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
                dataKey="label"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                dy={10}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={formatCurrency}
                width={80}
              />
              <Tooltip
                content={<CustomTooltip formatValue={formatCurrency} />}
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

