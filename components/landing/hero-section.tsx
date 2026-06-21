'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { HeroFloatingAccents } from './hero-floating-accents';
import { DashboardPreview } from './mockups/dashboard-preview';
import { ScrollReveal } from './scroll-reveal';

const stats = [
  { value: '127+', label: 'Loans tracked' },
  { value: '24', label: 'Investors' },
  { value: '4.9', label: 'User satisfaction' },
  { value: '24/7', label: 'Business insights' },
];

export function HeroSection() {
  return (
    <section className="landing-hero relative overflow-x-hidden pt-28 pb-16 sm:pb-24 lg:pb-32">
      <div className="landing-mesh pointer-events-none absolute inset-0 -z-10" />
      <div className="landing-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.35]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <ScrollReveal>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm font-medium text-primary landing-shimmer-badge">
                <Sparkles className="h-4 w-4" />
                Built for modern pawn businesses
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-[3.5rem] xl:leading-[1.08]">
                Run your pawn business with{' '}
                <span className="landing-gradient-text">clarity</span> and
                control
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                PawnTracker unifies loans, investors, and transactions in one
                beautiful system, so always know what&apos;s due, what&apos;s
                collected, and what&apos;s next.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    className="group h-12 rounded-2xl px-8 text-base shadow-[var(--shadow-soft)]"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#showcase">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-2xl px-8 text-base border-border/60"
                  >
                    <Play className="mr-2 h-4 w-4 fill-primary text-primary" />
                    See the App
                  </Button>
                </a>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={200} direction="left" className="relative">
            <div className="relative mx-auto w-full max-w-xl overflow-visible px-3 sm:px-5 lg:max-w-none">
              <div className="landing-orb landing-orb-1" />
              <div className="landing-orb landing-orb-2" />

              <div className="relative z-10 overflow-visible animate-float">
                <DashboardPreview />
                <HeroFloatingAccents />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
