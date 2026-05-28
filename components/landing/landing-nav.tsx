'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#showcase', label: 'Product' },
  { href: '#philosophy', label: 'Why Us' },
  { href: '#testimonials', label: 'Reviews' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled
            ? 'border-b border-border/50 bg-background/75 py-3 backdrop-blur-xl shadow-sm'
            : 'bg-transparent py-5',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="relative z-10">
            <Logo size="md" showIcon gradient animated />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="rounded-xl">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="sm" className="rounded-xl px-5 shadow-[var(--shadow-soft)]">
                Get Started
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/80 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col border-l border-border/50 bg-card/98 p-6 pt-20 backdrop-blur-xl">
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-xl">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
