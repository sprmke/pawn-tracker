import { SHOW_TRANSACTIONS_UI } from '@/lib/feature-flags';

export function LogoMarquee() {
  const allItems = [
    'Loan Tracking',
    'Investor Management',
    'Transaction Ledger',
    'Due Date Alerts',
    'Analytics Dashboard',
    'Multi Loan Types',
    'Secure & Private',
  ];

  const items = allItems.filter(
    (item) => SHOW_TRANSACTIONS_UI || item !== 'Transaction Ledger',
  );

  const repeated = [...items, ...items];

  return (
    <section className="border-y border-border/50 bg-muted/30 py-10 overflow-hidden">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Everything your pawn business needs
      </p>
      <div className="landing-marquee flex whitespace-nowrap">
        {repeated.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="mx-8 inline-flex items-center gap-3 text-sm font-semibold text-muted-foreground/80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
