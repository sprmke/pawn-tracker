'use client';

import { BarChart } from './bar-chart';
import { formatCurrency } from '@/lib/format';
import { useSensitiveDataHidden } from '@/hooks';

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
  emptyMessage?: string;
}

export function CurrencyBarChart(props: CurrencyBarChartProps) {
  useSensitiveDataHidden();

  return <BarChart {...props} formatValue={formatCurrency} />;
}
