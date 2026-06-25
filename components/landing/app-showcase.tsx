'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollReveal } from './scroll-reveal';
import { DashboardPreview } from './mockups/dashboard-preview';
import { LoansPreview } from './mockups/loans-preview';
import { InvestorsPreview } from './mockups/investors-preview';
import { TransactionsPreview } from './mockups/transactions-preview';
import { SHOW_TRANSACTIONS_UI } from '@/lib/feature-flags';

const allTabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Summary metrics, charts, and activity at a glance.',
    component: DashboardPreview,
  },
  {
    id: 'loans',
    label: 'Loans',
    description: 'Track Lot Title, OR/CR, and Agent loans with statuses.',
    component: LoansPreview,
  },
  {
    id: 'investors',
    label: 'Investors',
    description: 'Capital, returns, and active loan participation.',
    component: InvestorsPreview,
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Full ledger of collections, disbursements, and returns.',
    component: TransactionsPreview,
  },
] as const;

const tabs = allTabs.filter(
  (tab) => SHOW_TRANSACTIONS_UI || tab.id !== 'transactions',
);

export function AppShowcase() {
  const [active, setActive] =
    useState<(typeof tabs)[number]['id']>('dashboard');
  const ActivePreview = tabs.find((t) => t.id === active)!.component;
  const activeTab = tabs.find((t) => t.id === active)!;

  return (
    <section id="showcase" className="py-24 sm:py-32 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">Product Tour</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            See PawnTracker in action
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Browse real app screens with amounts shown, and see how your team
            will manage loans, investors, and cashflow every day.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150} className="mt-12">
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  'rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  active === tab.id
                    ? 'bg-primary text-primary-foreground shadow-[var(--shadow-soft)]'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {activeTab.description}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={250} className="mt-10">
          <div className="relative mx-auto max-w-4xl transition-all duration-500">
            <div className="landing-showcase-glow absolute -inset-4 -z-10 rounded-[2rem] opacity-60" />
            <div key={active} className="landing-tab-enter">
              <ActivePreview />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
