'use client';

import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Eye, Maximize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const buttonSize = size === 'md' ? 'sm' : size;

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      className={`${
        size === 'sm' ? 'h-7 text-xs' : 'h-8 text-xs'
      } ${className}`}
      onClick={onToggle}
    >
      {isExpanded ? (
        <>
          <ChevronUp
            className={`${size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1`}
          />
          Hide
        </>
      ) : (
        <>
          <ChevronDown
            className={`${size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1`}
          />
          More
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
  const buttonSize = size === 'md' ? 'sm' : size;

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      className={`${
        size === 'sm' ? 'h-7 text-xs' : 'h-8 text-xs'
      } ${className}`}
      onClick={onClick}
    >
      <Maximize2
        className={`${size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1`}
      />
      Quick View
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
  const buttonSize = size === 'md' ? 'sm' : size;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      router.push(href);
    }
  };

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      className={`${
        size === 'sm' ? 'h-7 text-xs' : 'h-8 text-xs'
      } ${className}`}
      onClick={handleClick}
    >
      <Eye className={`${size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1`} />
      View
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
  size = 'sm',
  className = '',
}: ActionButtonsGroupProps) {
  const isCardSize = size === 'md';

  return (
    <div
      className={`flex items-center ${
        isCardSize ? 'gap-2' : 'justify-end gap-1'
      } ${className}`}
    >
      {onQuickView ? (
        <QuickViewButton
          onClick={onQuickView}
          size={size}
          className={isCardSize ? 'flex-1' : ''}
        />
      ) : showToggle && onToggle ? (
        <ToggleMoreButton
          isExpanded={isExpanded}
          onToggle={onToggle}
          size={size}
          className={isCardSize ? 'flex-1' : ''}
        />
      ) : null}
      <ViewButton
        href={viewHref}
        size={size}
        onClick={onViewClick}
        className={isCardSize ? 'flex-1' : ''}
      />
    </div>
  );
}
