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
import { CustomTooltip } from './custom-tooltip';
import { BarChart3 } from 'lucide-react';
import {
  ChartCard,
  ChartEmptyState,
  ChartGradientDefs,
  ChartLegend,
} from './chart-shell';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_MARGIN,
  chartGradientId,
} from './chart-theme';

interface BarChartProps {
  data: Array<{ [key: string]: unknown }>;
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

export function BarChart({
  data,
  title,
  dataKeys,
  xAxisKey,
  formatValue = (value) => value.toString(),
  layout = 'horizontal',
  emptyMessage,
}: BarChartProps) {
  const isEmpty =
    !data ||
    data.length === 0 ||
    dataKeys.every((dataKey) =>
      data.every((item) => !item[dataKey.key] || item[dataKey.key] === 0)
    );

  return (
    <ChartCard title={title}>
      {isEmpty ? (
        <ChartEmptyState
          icon={BarChart3}
          message={emptyMessage || 'No data available'}
        />
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <RechartsBarChart
            data={data}
            layout={layout}
            margin={CHART_MARGIN}
            barGap={6}
            barCategoryGap="18%"
          >
            <ChartGradientDefs
              keys={dataKeys.map((dk) => ({ id: dk.key, color: dk.color }))}
            />
            <CartesianGrid {...CHART_GRID} />
            {layout === 'horizontal' ? (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  tick={CHART_AXIS.tick}
                  tickLine={CHART_AXIS.tickLine}
                  axisLine={CHART_AXIS.axisLine}
                  dy={8}
                  interval={0}
                  tickFormatter={(value: string) =>
                    value.length > 12 ? `${value.slice(0, 11)}…` : value
                  }
                />
                <YAxis
                  tick={CHART_AXIS.tick}
                  tickLine={CHART_AXIS.tickLine}
                  axisLine={CHART_AXIS.axisLine}
                  tickFormatter={formatValue}
                  width={72}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  tick={CHART_AXIS.tick}
                  tickLine={CHART_AXIS.tickLine}
                  axisLine={CHART_AXIS.axisLine}
                  tickFormatter={formatValue}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  tick={CHART_AXIS.tick}
                  tickLine={CHART_AXIS.tickLine}
                  axisLine={CHART_AXIS.axisLine}
                  width={100}
                />
              </>
            )}
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} />}
              cursor={{ fill: '#ebe7e2', opacity: 0.45 }}
            />
            <Legend content={<ChartLegend variant="bar" />} />
            {dataKeys.map((dataKey) => (
              <Bar
                key={dataKey.key}
                dataKey={dataKey.key}
                name={dataKey.label}
                fill={`url(#${chartGradientId(dataKey.key)})`}
                radius={[10, 10, 4, 4]}
                maxBarSize={48}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
