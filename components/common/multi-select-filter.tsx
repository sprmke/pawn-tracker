'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  className?: string;
  triggerClassName?: string;
}

export function MultiSelectFilter({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  allLabel = 'All',
  className,
  triggerClassName,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const getDisplayText = () => {
    if (selected.length === 0) {
      return allLabel;
    }
    if (selected.length === 1) {
      return options.find((o) => o.value === selected[0])?.label || selected[0];
    }
    return `${selected.length} selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-10 justify-between font-normal',
            selected.length > 0 && 'border-primary/50',
            triggerClassName
          )}
        >
          <span className="truncate text-sm">{getDisplayText()}</span>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <span
                role="button"
                onClick={handleClear}
                className="h-4 w-4 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[200px] p-0', className)} align="start">
        <div className="p-2">
          {/* Select All / Clear Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b">
            <span className="text-xs font-semibold text-muted-foreground">
              {placeholder}
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {selected.length === options.length ? 'Clear All' : 'Select All'}
            </button>
          </div>

          {/* Options List */}
          <div className="max-h-[240px] overflow-y-auto space-y-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary/10 hover:bg-primary/15'
                      : 'hover:bg-accent'
                  )}
                  onClick={() => handleToggle(option.value)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(option.value)}
                    className="pointer-events-none"
                  />
                  <span className="text-sm">{option.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

