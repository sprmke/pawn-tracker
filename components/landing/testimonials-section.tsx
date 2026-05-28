'use client';

import { Quote, Star } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

const testimonials = [
  {
    quote:
      'Finally a system that understands pawn loans. We replaced three spreadsheets in the first week.',
    name: 'Rico M.',
    role: 'Pawn Business Owner, Cebu',
    rating: 5,
  },
  {
    quote:
      'The dashboard alerts alone saved us from missing past-due collections. Worth every minute.',
    name: 'Patricia L.',
    role: 'Operations Manager',
    rating: 5,
  },
  {
    quote:
      'Investor tracking used to be a nightmare. Now I can show returns in seconds.',
    name: 'James T.',
    role: 'Multi-branch Operator',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-24 py-24 sm:py-32 bg-muted/25"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">Testimonials</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            What operators are saying
          </h2>
          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              Loved by pawn professionals
            </span>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-3xl border border-border/50 bg-card p-8 shadow-[var(--shadow-elevated)]">
                <Quote className="h-8 w-8 text-primary/40" />
                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-border/40 pt-6">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
