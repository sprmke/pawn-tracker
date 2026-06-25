'use client';

import {
  BarChart3,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';
import { SHOW_TRANSACTIONS_UI } from '@/lib/feature-flags';

const allFeatures = [
  {
    icon: FileText,
    title: 'Loan Management',
    description:
      'Lot Title, OR/CR, and Agent loans with due dates, statuses, and full history.',
    accent: 'bg-primary/12 text-primary',
  },
  {
    icon: Users,
    title: 'Investor Tracking',
    description:
      'Capital deployed, expected returns, and participation across your portfolio.',
    accent: 'bg-chart-2/12 text-chart-2',
  },
  {
    icon: TrendingUp,
    title: 'Transaction Ledger',
    description:
      'Every collection and disbursement logged with a complete audit trail.',
    accent: 'bg-chart-3/12 text-chart-3',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Charts',
    description:
      'Cashflow trends, loan type breakdowns, and weekly performance visuals.',
    accent: 'bg-chart-4/12 text-chart-4',
  },
  {
    icon: Clock,
    title: 'Due Date Alerts',
    description:
      'Past due, maturing soon, and pending disbursements surfaced on your dashboard.',
    accent: 'bg-chart-5/12 text-chart-5',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description:
      'Your data stays yours. Sign in with Google and manage access with confidence.',
    accent: 'bg-primary/12 text-primary',
  },
];

const features = allFeatures.filter(
  (feature) =>
    SHOW_TRANSACTIONS_UI || feature.title !== 'Transaction Ledger',
);

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">Features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Purpose-built for pawn operations. No generic spreadsheets, no
            banking software that misses how your shop actually runs.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 80}>
              <div className="group h-full rounded-3xl border border-border/50 bg-card p-8 shadow-[var(--shadow-elevated)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated-lg)]">
                <div
                  className={`icon-well-lg mb-6 ${feature.accent} transition-transform duration-300 group-hover:scale-105`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
