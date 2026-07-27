'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface CardSelectionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  ariaLabel?: string;
}

export function CardSelectionCheckbox({
  checked,
  onCheckedChange,
  className,
  ariaLabel = 'Select item',
}: CardSelectionCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      onClick={(e) => e.stopPropagation()}
      aria-label={ariaLabel}
      className={cn('shrink-0', className)}
    />
  );
}

export function getSelectableCardClassName(selected: boolean) {
  return selected ? 'ring-2 ring-primary ring-offset-2' : '';
}

export function toggleSelectedId(
  selectedIds: Set<string | number>,
  id: string | number,
): Set<string | number> {
  const next = new Set(selectedIds);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}
