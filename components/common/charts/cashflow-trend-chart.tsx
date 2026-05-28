'use client';

import { useState } from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { CustomTooltip } from './custom-tooltip';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import {
  ChartAreaGradientDefs,
  ChartCard,
  ChartEmptyState,
  ChartLegend,
} from './chart-shell';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_PALETTE,
  chartGradientId,
} from './chart-theme';

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
  { key: 'inflow', label: 'Inflow', color: CHART_PALETTE.teal },
  { key: 'outflow', label: 'Outflow', color: CHART_PALETTE.coral },
  { key: 'net', label: 'Net', color: CHART_PALETTE.primary },
];

const periodLabels: Record<TimePeriod, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
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

  const isEmpty =
    !data ||
    data.length == 0 ||
    dataKeys.every((dataKey) =>
      data.every(
        (item) =>
          !item[dataKey.key as keyof CashflowData] ||
          item[dataKey.key as keyof CashflowData] == 0
      )
    );

  const periodToggle = (
    <div className="pill-segment self-start">
      {(['day', 'week', 'month'] as TimePeriod[]).map((p) => (
        <Button
          key={p}
          variant={period == p ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setPeriod(p)}
          className="h-8 rounded-xl px-3.5 text-xs font-semibold"
        >
          {periodLabels[p]}
        </Button>
      ))}
    </div>
  );

  return (
    <ChartCard title={title} action={periodToggle}>
      {isEmpty ? (
        <ChartEmptyState icon={TrendingUp} message={emptyMessage} />
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <ComposedChart data={data} margin={CHART_MARGIN}>
            <ChartAreaGradientDefs
              keys={dataKeys.map((dk) => ({ id: dk.key, color: dk.color }))}
            />
            <CartesianGrid {...CHART_GRID} />
            <XAxis
              dataKey="label"
              tick={CHART_AXIS.tick}
              tickLine={CHART_AXIS.tickLine}
              axisLine={CHART_AXIS.axisLine}
              dy={8}
            />
            <YAxis
              tick={CHART_AXIS.tick}
              tickLine={CHART_AXIS.tickLine}
              axisLine={CHART_AXIS.axisLine}
              tickFormatter={formatCurrency}
              width={72}
            />
            <Tooltip
              content={<CustomTooltip formatValue={formatCurrency} />}
              cursor={{
                stroke: '#e8e4df',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Legend content={<ChartLegend />} />
            {dataKeys.map((dataKey) =>
              dataKey.key == 'net' ? (
                <Line
                  key={dataKey.key}
                  type="monotone"
                  dataKey={dataKey.key}
                  name={dataKey.label}
                  stroke={dataKey.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    fill: '#fff',
                    stroke: dataKey.color,
                  }}
                />
              ) : (
                <Area
                  key={dataKey.key}
                  type="monotone"
                  dataKey={dataKey.key}
                  name={dataKey.label}
                  stroke={dataKey.color}
                  strokeWidth={2}
                  fill={`url(#${chartGradientId(dataKey.key)}-area)`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: '#fff',
                    stroke: dataKey.color,
                  }}
                />
              )
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
