import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { BrowserFrame } from './browser-frame';

const metrics = [
  {
    label: 'Total Principal',
    value: '₱4,850,000',
    icon: Wallet,
    accent: 'bg-primary/12 text-primary',
  },
  {
    label: 'Active Loans',
    value: '127',
    icon: Activity,
    accent: 'bg-chart-5/15 text-chart-5',
  },
  {
    label: 'Collected',
    value: '₱892,400',
    icon: CheckCircle2,
    accent: 'bg-chart-4/12 text-chart-4',
  },
  {
    label: 'Interest Due',
    value: '₱156,200',
    icon: TrendingUp,
    accent: 'bg-chart-2/12 text-chart-2',
  },
  {
    label: 'Investors',
    value: '24',
    icon: CircleDollarSign,
    accent: 'bg-chart-1/12 text-chart-1',
  },
];

export function DashboardPreview({ glow = true }: { glow?: boolean }) {
  return (
    <BrowserFrame title="dashboard" glow={glow}>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Overview
          </p>
          <h3 className="text-sm font-bold text-foreground">Dashboard</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Your pawn business at a glance
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {metrics.slice(0, 3).map((m) => (
            <div
              key={m.label}
              className="min-w-0 rounded-xl border border-border/40 bg-card p-2.5 shadow-sm"
            >
              <div
                className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg ${m.accent}`}
              >
                <m.icon className="h-3.5 w-3.5" />
              </div>
              <p className="truncate text-[9px] text-muted-foreground">
                {m.label}
              </p>
              <p className="truncate text-xs font-bold tabular-nums">
                {m.value}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metrics.slice(3).map((m) => (
            <div
              key={m.label}
              className="min-w-0 rounded-xl border border-border/40 bg-card p-2.5 shadow-sm"
            >
              <div
                className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg ${m.accent}`}
              >
                <m.icon className="h-3.5 w-3.5" />
              </div>
              <p className="truncate text-[9px] text-muted-foreground">
                {m.label}
              </p>
              <p className="truncate text-xs font-bold tabular-nums">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border/40 bg-card p-3">
            <p className="text-[10px] font-semibold mb-2">Weekly Cashflow</p>
            <div className="flex items-end gap-1 h-16">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-primary/80 to-primary/30"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-3">
            <p className="text-[10px] font-semibold mb-2">Loan Types</p>
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-full border-[6px] border-primary border-r-chart-2 border-b-chart-5 border-l-chart-4" />
              <div className="space-y-1 text-[9px]">
                <p>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mr-1" />
                  Lot Title 42%
                </p>
                <p>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-2 mr-1" />
                  OR/CR 31%
                </p>
                <p>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-5 mr-1" />
                  Agent 27%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Past Due', count: 3 },
            { label: 'Maturing', count: 8 },
            { label: 'Pending', count: 2 },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-xl border border-border/40 bg-muted/30 px-2 py-2 sm:px-3"
            >
              <p className="truncate text-[9px] font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className="text-sm font-bold whitespace-nowrap">
                {item.count}{' '}
                <span className="text-[10px] font-medium text-muted-foreground">
                  loans
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}
