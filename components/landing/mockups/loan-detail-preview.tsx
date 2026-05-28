import { Calendar, FileText, Users } from 'lucide-react';
import { BrowserFrame } from './browser-frame';

export function LoanDetailPreview() {
  return (
    <BrowserFrame title="loans/42">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground">
                Mexico, Pampanga
              </h3>
              <span className="rounded-md bg-primary/12 px-2 py-0.5 text-[9px] font-semibold text-primary">
                Lot Title
              </span>
              <span className="rounded-md bg-chart-2/15 px-2 py-0.5 text-[9px] font-semibold text-chart-2">
                Active
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Due Jun 28, 2026 · Principal ₱250,000
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Principal', value: '₱250,000', icon: FileText },
            { label: 'Investors', value: '2', icon: Users },
            { label: 'Next due', value: 'Jun 28', icon: Calendar },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/40 bg-card p-2.5"
            >
              <item.icon className="mb-1.5 h-3.5 w-3.5 text-primary" />
              <p className="text-[9px] text-muted-foreground">{item.label}</p>
              <p className="text-[11px] font-bold tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
          <p className="text-[10px] font-semibold text-foreground">
            Interest periods
          </p>
          <div className="mt-2 space-y-1.5">
            {[
              { period: 'May 2026', amount: '₱7,500', status: 'Paid' },
              { period: 'Jun 2026', amount: '₱7,500', status: 'Due' },
            ].map((row) => (
              <div
                key={row.period}
                className="flex items-center justify-between rounded-lg bg-card px-2.5 py-2 text-[10px]"
              >
                <span className="font-medium">{row.period}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{row.amount}</span>
                  <span
                    className={
                      row.status === 'Paid'
                        ? 'rounded-md bg-chart-2/15 px-1.5 py-0.5 text-[9px] font-medium text-chart-2'
                        : 'rounded-md bg-chart-5/15 px-1.5 py-0.5 text-[9px] font-medium text-chart-5'
                    }
                  >
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
