'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Eye, Maximize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNavigationProgress } from './navigation-progress';
import { cn } from '@/lib/utils';

/** Full-bleed footer actions pinned to the card edge */
const cardActionButtonClass =
  'h-9 min-h-9 w-full flex-1 rounded-none px-4 text-xs font-medium gap-1.5 hover:bg-muted/60 shadow-none [&_svg]:size-3.5 only:rounded-b-3xl first:rounded-bl-3xl last:rounded-br-3xl';

const tableActionButtonClass = 'h-7 text-xs px-2 gap-1 [&_svg]:size-3';

interface ToggleMoreButtonProps {
  isExpanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function ToggleMoreButton({
  isExpanded,
  onToggle,
  size = 'sm',
  className = '',
}: ToggleMoreButtonProps) {
  const isCardSize = size === 'md';

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        isCardSize ? cardActionButtonClass : tableActionButtonClass,
        className,
      )}
      onClick={onToggle}
    >
      {isExpanded ? (
        <>
          <ChevronUp />
          <span className={isCardSize ? 'inline' : 'hidden md:inline'}>
            Hide
          </span>
        </>
      ) : (
        <>
          <ChevronDown />
          <span className={isCardSize ? 'inline' : 'hidden md:inline'}>
            More
          </span>
        </>
      )}
    </Button>
  );
}

interface QuickViewButtonProps {
  onClick: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuickViewButton({
  onClick,
  size = 'sm',
  className = '',
}: QuickViewButtonProps) {
  const isCardSize = size === 'md';

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        isCardSize ? cardActionButtonClass : tableActionButtonClass,
        className,
      )}
      onClick={onClick}
    >
      <Maximize2 />
      <span className={isCardSize ? 'inline' : 'hidden md:inline'}>View</span>
    </Button>
  );
}

interface ViewButtonProps {
  href: string;
  size?: 'sm' | 'md';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ViewButton({
  href,
  size = 'sm',
  className = '',
  onClick,
}: ViewButtonProps) {
  const router = useRouter();
  const { startProgress } = useNavigationProgress();
  const isCardSize = size === 'md';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      // Start progress bar before programmatic navigation
      startProgress();
      router.push(href);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        isCardSize ? cardActionButtonClass : tableActionButtonClass,
        className,
      )}
      onClick={handleClick}
    >
      <Eye />
      <span className={isCardSize ? 'inline' : 'hidden md:inline'}>View</span>
    </Button>
  );
}

interface ActionButtonsGroupProps {
  isExpanded?: boolean;
  onToggle?: (e: React.MouseEvent) => void;
  viewHref: string;
  onViewClick?: (e: React.MouseEvent) => void;
  onQuickView?: (e: React.MouseEvent) => void;
  showToggle?: boolean;
  showView?: boolean;
  hideViewOnMobile?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ActionButtonsGroup({
  isExpanded = false,
  onToggle,
  viewHref,
  onViewClick,
  onQuickView,
  showToggle = true,
  showView = true,
  hideViewOnMobile = true,
  size = 'sm',
  className = '',
}: ActionButtonsGroupProps) {
  const isCardSize = size === 'md';

  return (
    <div
      className={cn(
        'flex items-stretch',
        isCardSize ? 'w-full' : 'justify-end gap-1 md:gap-1.5',
        className,
      )}
    >
      {showToggle && onToggle && (
        <ToggleMoreButton
          isExpanded={isExpanded}
          onToggle={onToggle}
          size={size}
          className={isCardSize ? 'flex-1' : 'hidden md:inline-flex'}
        />
      )}
      {onQuickView && (
        <QuickViewButton
          onClick={onQuickView}
          size={size}
          className={isCardSize ? 'flex-1' : ''}
        />
      )}
      {showView && (
        <ViewButton
          href={viewHref}
          size={size}
          onClick={onViewClick}
          className={cn(
            isCardSize && 'flex-1',
            !isCardSize && hideViewOnMobile && 'hidden md:inline-flex',
          )}
        />
      )}
    </div>
  );
}

export function CardActionFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mt-auto border-t border-border/50', className)}>
      {children}
    </div>
  );
}
