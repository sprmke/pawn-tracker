'use client';

import { LineChart } from './line-chart';
import { formatCurrency } from '@/lib/format';

interface CurrencyLineChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  xAxisKey: string;
  dataKeys: Array<{
    key: string;
    label: string;
    color: string;
  }>;
}

export function CurrencyLineChart(props: CurrencyLineChartProps) {
  return <LineChart {...props} formatValue={formatCurrency} />;
}

