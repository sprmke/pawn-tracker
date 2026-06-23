import { ArrowUpDown } from 'lucide-react';
import { ReactNode } from 'react';

interface SortButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

export function SortButton({ children, onClick, className }: SortButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex max-w-full items-center gap-1 text-left leading-tight hover:text-foreground transition-colors ${
        className || ''
      }`}
    >
      <span className="min-w-0">{children}</span>
      <ArrowUpDown className="h-2.5 w-2.5 shrink-0 opacity-70" />
    </button>
  );
}
