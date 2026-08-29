'use client';

import { PieChart } from './pie-chart';
import { useSensitiveDataHidden } from '@/hooks';

interface LoanTypePieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title: string;
  colors?: string[];
  emptyMessage?: string;
}

export function LoanTypePieChart(props: LoanTypePieChartProps) {
  useSensitiveDataHidden();

  return <PieChart {...props} formatValue={(value) => `${value} loans`} />;
}
