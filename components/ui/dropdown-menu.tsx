'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  separatorBefore?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
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
  const [dropdownMinWidth, setDropdownMinWidth] = React.useState<
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
      // Keep menu at least as wide as the trigger, but allow longer labels to expand.
      if (triggerRef.current) {
        setDropdownMinWidth(Math.max(triggerRef.current.offsetWidth, 176));
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
            'absolute z-50 mt-2 w-max overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
            align === 'end' ? 'right-0' : 'left-0'
          )}
          style={{
            minWidth: dropdownMinWidth ? `${dropdownMinWidth}px` : undefined,
          }}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.separatorBefore && index > 0 ? (
                <div className="my-1 h-px bg-border" role="separator" />
              ) : null}
              <button
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center whitespace-nowrap rounded-lg px-2 py-1.5 text-sm outline-none transition-colors',
                  item.destructive
                    ? 'text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive'
                    : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                )}
              >
                {item.icon && <span className="mr-2 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
