'use client';

import { BarChart } from './bar-chart';
import { formatCurrency } from '@/lib/format';

interface CurrencyBarChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  xAxisKey: string;
  dataKeys: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  layout?: 'horizontal' | 'vertical';
}

export function CurrencyBarChart(props: CurrencyBarChartProps) {
  return <BarChart {...props} formatValue={formatCurrency} />;
}

