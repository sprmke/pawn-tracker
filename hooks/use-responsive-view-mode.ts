'use client';

import { useState, useEffect, useCallback } from 'react';

type ViewMode = 'cards' | 'table' | 'calendar';

interface UseResponsiveViewModeOptions {
  /**
   * The default view mode to use on desktop (>= md breakpoint)
   * @default 'table'
   */
  defaultDesktopMode?: ViewMode;
  /**
   * The default view mode to use on mobile (< md breakpoint)
   * @default 'cards'
   */
  defaultMobileMode?: ViewMode;
  /**
   * Whether to include calendar as a possible view mode
   * @default false
   */
  includeCalendar?: boolean;
  /**
   * Breakpoint in pixels for mobile detection
   * @default 768 (md breakpoint)
   */
  mobileBreakpoint?: number;
}

interface UseResponsiveViewModeReturn<T extends ViewMode> {
  /**
   * The current view mode
   */
  viewMode: T;
  /**
   * Function to set the view mode
   */
  setViewMode: (mode: T) => void;
  /**
   * Whether the initial view mode has been determined (for SSR/hydration)
   * Use this to show a loading state to prevent table-to-card flash
   */
  isReady: boolean;
  /**
   * Whether the current screen is mobile
   */
  isMobile: boolean;
}

/**
 * A hook that handles responsive view mode switching between table/cards/calendar
 * with proper SSR support to prevent layout flash during hydration.
 * 
 * On mobile devices (< md breakpoint), it defaults to 'cards' view.
 * On desktop devices (>= md breakpoint), it defaults to 'table' view.
 * 
 * The hook returns `isReady: false` until the screen size is determined,
 * allowing you to show a loading state instead of flashing between views.
 */
export function useResponsiveViewMode<
  T extends ViewMode = 'cards' | 'table'
>(
  options: UseResponsiveViewModeOptions = {}
): UseResponsiveViewModeReturn<T> {
  const {
    defaultDesktopMode = 'table',
    defaultMobileMode = 'cards',
    mobileBreakpoint = 768,
  } = options;

  // Start with null to indicate we haven't determined the view mode yet
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewModeState] = useState<T>(defaultDesktopMode as T);

  // Custom setter that respects mobile constraints
  const setViewMode = useCallback(
    (mode: T) => {
      // On mobile, don't allow switching to table view
      if (isMobile && mode === 'table') {
        setViewModeState('cards' as T);
      } else {
        setViewModeState(mode);
      }
    },
    [isMobile]
  );

  useEffect(() => {
    // Determine initial view mode based on screen size
    const checkScreenSize = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(mobile);
      return mobile;
    };

    // Set initial state
    const mobile = checkScreenSize();
    
    // Set the appropriate view mode based on screen size
    // Only change if we're on mobile and currently set to table
    if (mobile) {
      setViewModeState((current) => 
        current === 'table' ? (defaultMobileMode as T) : current
      );
    }
    
    // Mark as ready after determining screen size
    setIsReady(true);

    // Handle resize events
    const handleResize = () => {
      const mobile = checkScreenSize();
      
      // If switching to mobile and currently on table, switch to cards
      if (mobile) {
        setViewModeState((current) =>
          current === 'table' ? (defaultMobileMode as T) : current
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [defaultMobileMode, mobileBreakpoint]);

  return {
    viewMode,
    setViewMode,
    isReady,
    isMobile,
  };
}

