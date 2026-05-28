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
import { CustomTooltip } from './custom-tooltip';
import { TrendingUp } from 'lucide-react';
import { ChartCard, ChartEmptyState, ChartLegend } from './chart-shell';
import { CHART_AXIS, CHART_GRID, CHART_HEIGHT, CHART_MARGIN } from './chart-theme';

interface LineChartProps {
  data: Array<{ [key: string]: unknown }>;
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

export function LineChart({
  data,
  title,
  dataKeys,
  xAxisKey,
  formatValue = (value) => value.toString(),
  emptyMessage,
}: LineChartProps) {
  const isEmpty =
    !data ||
    data.length == 0 ||
    dataKeys.every((dataKey) =>
      data.every((item) => !item[dataKey.key] || item[dataKey.key] == 0)
    );

  return (
    <ChartCard title={title}>
      {isEmpty ? (
        <ChartEmptyState
          icon={TrendingUp}
          message={emptyMessage || 'No data available'}
        />
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <RechartsLineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis
              dataKey={xAxisKey}
              tick={CHART_AXIS.tick}
              tickLine={CHART_AXIS.tickLine}
              axisLine={CHART_AXIS.axisLine}
              dy={8}
            />
            <YAxis
              tick={CHART_AXIS.tick}
              tickLine={CHART_AXIS.tickLine}
              axisLine={CHART_AXIS.axisLine}
              tickFormatter={formatValue}
              width={72}
            />
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} />}
              cursor={{
                stroke: '#e8e4df',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Legend content={<ChartLegend />} />
            {dataKeys.map((dataKey) => (
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
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
