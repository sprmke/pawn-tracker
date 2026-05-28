'use client';

import { Eye, Layers, Zap } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

const principles = [
  {
    icon: Layers,
    title: 'Simplicity',
    description:
      'One dashboard for your whole operation. No clutter, no learning curve.',
  },
  {
    icon: Eye,
    title: 'Visibility',
    description:
      'Toggle prices on or off for privacy — full amounts when you need them.',
  },
  {
    icon: Zap,
    title: 'Speed',
    description:
      'Record loans and transactions in seconds. Spend time growing, not typing.',
  },
];

export function FeaturesDarkSection() {
  return (
    <section className="landing-dark-section relative overflow-hidden py-24 sm:py-32">
      <div className="landing-dark-mesh pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Guiding Principles
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built the way pawn businesses actually work
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {principles.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 100}>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-colors duration-300 hover:border-primary/40 hover:bg-white/8">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  {item.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
