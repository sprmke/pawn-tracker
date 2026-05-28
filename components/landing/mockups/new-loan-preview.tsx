import { Plus, UserPlus } from 'lucide-react';
import { BrowserFrame } from './browser-frame';

export function NewLoanPreview() {
  return (
    <BrowserFrame title="loans/new">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              New loan
            </p>
            <h3 className="text-sm font-bold text-foreground">Create Loan</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Add a new loan with investor allocations
            </p>
          </div>
          <span className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground">
            Create Loan
          </span>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-3.5">
          <p className="text-[11px] font-semibold text-foreground">Loan Details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[9px] font-medium text-muted-foreground">
                Loan Name / Label *
              </label>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-[11px] font-medium">
                Mexico, Pampanga
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-medium text-muted-foreground">
                Type *
              </label>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-[11px]">
                Lot Title
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-medium text-muted-foreground">
                Due Date *
              </label>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-[11px]">
                Jun 28, 2026
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-foreground">Investors</p>
            <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-2 py-1 text-[9px] font-medium text-primary">
              <UserPlus className="h-3 w-3" />
              Add investor
            </span>
          </div>
          <div className="mt-3 rounded-xl border border-border/40 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold">Roberto Lim</p>
                <p className="text-[9px] text-muted-foreground">
                  Principal ₱250,000 · 3% monthly
                </p>
              </div>
              <span className="rounded-md bg-chart-2/15 px-2 py-0.5 text-[9px] font-medium text-chart-2">
                Allocated
              </span>
            </div>
          </div>
          <button
            type="button"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 py-2 text-[10px] font-medium text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add transaction
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
}
