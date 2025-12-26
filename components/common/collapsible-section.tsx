import { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollapsibleSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  trigger: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    showIndicator?: boolean;
  };
  children?: ReactNode;
  className?: string;
  inline?: boolean; // If true, only renders the button (content goes elsewhere)
}

export function CollapsibleSection({
  isOpen,
  onToggle,
  trigger,
  children,
  className,
  inline = false,
}: CollapsibleSectionProps) {
  const TriggerIcon = trigger.icon;

  const triggerButton = (
    <Button
      variant={isOpen ? 'secondary' : 'outline'}
      size="sm"
      onClick={onToggle}
      className={`whitespace-nowrap relative h-9 px-3 ${className || ''}`}
    >
      {TriggerIcon && <TriggerIcon className="h-4 w-4 xl:mr-2" />}
      <span className="hidden xl:inline">{trigger.label}</span>
      {trigger.showIndicator && (
        <span className="ml-1 xl:ml-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
      )}
      {isOpen ? (
        <ChevronUp className="h-4 w-4 ml-1 xl:ml-2" />
      ) : (
        <ChevronDown className="h-4 w-4 ml-1 xl:ml-2" />
      )}
    </Button>
  );

  // If inline mode, only return the button
  if (inline) {
    return triggerButton;
  }

  // Default mode: button and content in vertical layout
  return (
    <div className="space-y-3">
      {triggerButton}

      {isOpen && (
        <div className="p-4 border rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Separate component for the collapsible content
export function CollapsibleContent({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="p-4 border rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-200">
      {children}
    </div>
  );
}
