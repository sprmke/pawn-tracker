'use client';

import { PieChart } from './pie-chart';

interface LoanTypePieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title: string;
  colors?: string[];
}

export function LoanTypePieChart(props: LoanTypePieChartProps) {
  return <PieChart {...props} formatValue={(value) => `${value} loans`} />;
}
