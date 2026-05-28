'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';
import { WorkflowShowcase } from './workflow-showcase';

const points = [
  'Create loans with investor splits in minutes',
  'Calendar view for sent, due, and interest dates',
  'Track interest periods and payments per loan',
  'Export and back up your data anytime',
];

export function PhilosophySection() {
  return (
    <section id="philosophy" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal direction="right" className="order-2 lg:order-1">
            <WorkflowShowcase />
          </ScrollReveal>

          <div className="order-1 lg:order-2">
            <ScrollReveal>
              <p className="section-eyebrow">Why PawnTracker</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Your trusted partner for pawn business operations
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                We built PawnTracker because generic tools don&apos;t understand
                Lot Title loans, investor splits, or the pace of a busy pawn
                counter. You get software that speaks your language.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <ul className="mt-10 space-y-4">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal delay={250}>
              <Link href="/auth/signin" className="mt-10 inline-block">
                <Button size="lg" className="group rounded-2xl px-8">
                  Start managing smarter
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
