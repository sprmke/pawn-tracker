import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { BrowserFrame } from './browser-frame';

const txs = [
  {
    label: 'Collection — Maria Santos',
    amount: '+₱12,500',
    type: 'in' as const,
    date: 'May 26',
  },
  {
    label: 'Disbursement — Juan Dela Cruz',
    amount: '-₱180,000',
    type: 'out' as const,
    date: 'May 25',
  },
  {
    label: 'Investor Return — Roberto Lim',
    amount: '-₱8,400',
    type: 'out' as const,
    date: 'May 24',
  },
  {
    label: 'Collection — Ana Reyes',
    amount: '+₱4,750',
    type: 'in' as const,
    date: 'May 23',
  },
];

export function TransactionsPreview() {
  return (
    <BrowserFrame title="transactions">
      <div className="p-4 sm:p-5 space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Ledger
          </p>
          <h3 className="text-sm font-bold">Transactions</h3>
        </div>
        <div className="space-y-1.5">
          {txs.map((tx) => (
            <div
              key={tx.label}
              className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-card px-3 py-2.5"
            >
              <div
                className={
                  tx.type === 'in'
                    ? 'flex h-7 w-7 items-center justify-center rounded-lg bg-chart-2/15 text-chart-2'
                    : 'flex h-7 w-7 items-center justify-center rounded-lg bg-chart-3/15 text-chart-3'
                }
              >
                {tx.type === 'in' ? (
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium">{tx.label}</p>
                <p className="text-[9px] text-muted-foreground">{tx.date}</p>
              </div>
              <p
                className={`text-[10px] font-bold tabular-nums ${
                  tx.type === 'in' ? 'text-chart-2' : 'text-foreground'
                }`}
              >
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}
