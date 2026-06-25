import Link from 'next/link';
import { Logo } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { SHOW_TRANSACTIONS_UI } from '@/lib/feature-flags';

const navigateLinks = [
  { href: '#features', label: 'Features' },
  { href: '#showcase', label: 'Product' },
  { href: '#philosophy', label: 'Why Us' },
  { href: '#testimonials', label: 'Reviews' },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <Logo size="lg" showIcon gradient />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Professional pawn business management. Track loans, investors,
              and {SHOW_TRANSACTIONS_UI ? 'transactions' : 'borrowings'} in one
              modern platform.
            </p>
            <Link href="/auth/signin" className="mt-6 inline-block">
              <Button className="group rounded-2xl shadow-[var(--shadow-soft)]">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-4 lg:col-start-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Navigate
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {navigateLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Account
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li>
                  <Link
                    href="/auth/signin"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            &copy; {new Date().getFullYear()} PawnTracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
