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
      onClick={onClick}
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${
        className || ''
      }`}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}
