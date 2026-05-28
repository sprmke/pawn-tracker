'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

export function CtaSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ScrollReveal>
          <div className="landing-cta-banner relative isolate overflow-hidden rounded-[2rem] px-8 py-20 sm:px-16 sm:py-24">
            <div className="landing-cta-orbs pointer-events-none absolute inset-0" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                Ready to take control of your pawn business?
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-lg text-primary-foreground/85">
                Join operators who run smarter with loans, investors, and
                transactions in one place.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="group h-12 rounded-2xl px-8 text-base shadow-lg"
                  >
                    Sign In to Get Started
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
