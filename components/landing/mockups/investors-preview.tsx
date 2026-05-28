import { BrowserFrame } from './browser-frame';

const investors = [
  {
    name: 'Roberto Lim',
    invested: '₱1,200,000',
    returns: '₱84,000',
    active: 5,
  },
  {
    name: 'Elena Cruz',
    invested: '₱850,000',
    returns: '₱59,500',
    active: 3,
  },
  {
    name: 'Miguel Tan',
    invested: '₱2,100,000',
    returns: '₱147,000',
    active: 8,
  },
];

export function InvestorsPreview() {
  return (
    <BrowserFrame title="investors">
      <div className="p-4 sm:p-5 space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Capital
          </p>
          <h3 className="text-sm font-bold">Investors</h3>
        </div>
        <div className="space-y-2">
          {investors.map((inv) => (
            <div
              key={inv.name}
              className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {inv.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-[11px] font-semibold">{inv.name}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {inv.active} active loans
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tabular-nums">
                  {inv.invested}
                </p>
                <p className="text-[9px] text-chart-2 font-medium">
                  +{inv.returns}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}
