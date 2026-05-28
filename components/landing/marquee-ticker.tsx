const phrase = 'Smart Pawn Management';

export function MarqueeTicker() {
  const items = Array.from({ length: 12 }, (_, i) => (
    <span key={i} className="inline-flex items-center gap-6 px-6">
      <span>{phrase}</span>
      <span className="text-primary" aria-hidden>
        →
      </span>
    </span>
  ));

  return (
    <div className="overflow-hidden border-y border-border/60 bg-foreground py-5">
      <div className="landing-ticker flex whitespace-nowrap text-lg font-bold tracking-tight text-background sm:text-xl">
        {items}
        {items}
      </div>
    </div>
  );
}
