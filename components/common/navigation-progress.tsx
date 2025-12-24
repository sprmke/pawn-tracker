'use client';

import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface NavigationProgressContextType {
  startProgress: () => void;
  stopProgress: () => void;
}

const NavigationProgressContext =
  createContext<NavigationProgressContextType | null>(null);

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);
  if (!context) {
    throw new Error(
      'useNavigationProgress must be used within NavigationProgressProvider'
    );
  }
  return context;
}

export function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const startProgress = useCallback(() => {
    setIsNavigating(true);
    setIsVisible(true);
    setProgress(0);
  }, []);

  const stopProgress = useCallback(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setIsVisible(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Progress animation when navigating
  useEffect(() => {
    if (!isNavigating) return;

    // Quick initial progress
    const initialTimer = setTimeout(() => setProgress(30), 50);

    // Gradual progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down as we approach 90%
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(prev + increment, 90);
      });
    }, 200);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isNavigating]);

  // Stop progress when route changes
  useEffect(() => {
    stopProgress();
  }, [pathname, searchParams, stopProgress]);

  // Intercept link clicks for immediate feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');

      // Skip if it's an external link, anchor link, or has target="_blank"
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('#') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // Skip if already navigating to the same path
      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(href, window.location.origin);

      if (
        currentUrl.pathname === targetUrl.pathname &&
        currentUrl.search === targetUrl.search
      ) {
        return;
      }

      // Start progress immediately on click
      startProgress();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [startProgress]);

  return (
    <NavigationProgressContext.Provider value={{ startProgress, stopProgress }}>
      {/* Progress bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-[100] h-[5px] pointer-events-none transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Background track */}
        <div className="absolute inset-0 bg-primary/10" />

        {/* Progress indicator */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-chart-2 transition-all ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          style={{
            width: `${progress}%`,
            transitionDuration: progress === 100 ? '200ms' : '300ms',
          }}
        >
          {/* Glow effect at the leading edge */}
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white/30 to-transparent" />

          {/* Shimmer effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
      </div>
      {children}
    </NavigationProgressContext.Provider>
  );
}
