'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    destructive?: boolean;
  }>;
  align?: 'start' | 'end';
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'end',
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [dropdownWidth, setDropdownWidth] = React.useState<
    number | undefined
  >();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Use min width for menu so items aren't cramped when trigger is icon-only
      if (triggerRef.current) {
        setDropdownWidth(Math.max(triggerRef.current.offsetWidth, 160));
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
            align === 'end' ? 'right-0' : 'left-0'
          )}
          style={{ width: dropdownWidth ? `${dropdownWidth}px` : 'auto' }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                item.destructive
                  ? 'text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive'
                  : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              )}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
