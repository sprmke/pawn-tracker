'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollReveal } from './scroll-reveal';
import { NewLoanPreview } from './mockups/new-loan-preview';
import { CalendarPreview } from './mockups/calendar-preview';
import { LoanDetailPreview } from './mockups/loan-detail-preview';

const workflows = [
  {
    id: 'create-loan',
    label: 'Create Loan',
    description:
      'Set loan details, type, due date, and assign investors in one guided flow.',
    component: NewLoanPreview,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description:
      'See disbursements, due dates, and interest on a month or week calendar.',
    component: CalendarPreview,
  },
  {
    id: 'loan-detail',
    label: 'Loan Detail',
    description:
      'Track principal, investors, and interest periods for each loan.',
    component: LoanDetailPreview,
  },
] as const;

export function WorkflowShowcase() {
  const [active, setActive] =
    useState<(typeof workflows)[number]['id']>('create-loan');
  const ActivePreview = workflows.find((w) => w.id === active)!.component;
  const activeWorkflow = workflows.find((w) => w.id === active)!;

  return (
    <div className="relative mx-auto max-w-lg lg:max-w-none">
      <div className="landing-showcase-glow pointer-events-none absolute -inset-3 -z-10 rounded-[1.75rem] opacity-40 sm:-inset-4" />

      <ScrollReveal delay={100}>
        <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
          {workflows.map((workflow) => (
            <button
              key={workflow.id}
              type="button"
              onClick={() => setActive(workflow.id)}
              className={cn(
                'rounded-2xl px-4 py-2 text-xs font-semibold transition-all duration-300 sm:px-5 sm:text-sm',
                active === workflow.id
                  ? 'bg-primary text-primary-foreground shadow-[var(--shadow-soft)]'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {workflow.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground lg:text-left">
          {activeWorkflow.description}
        </p>
      </ScrollReveal>

      <ScrollReveal delay={200} className="mt-6">
        <div key={active} className="landing-tab-enter">
          <ActivePreview />
        </div>
      </ScrollReveal>
    </div>
  );
}
