'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

// Context for form state to communicate with dialog
interface DialogFormContextValue {
  isDirty: boolean;
  isSubmitting: boolean;
  setIsDirty: (dirty: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
}

const DialogFormContext = React.createContext<DialogFormContextValue | null>(null);

export function useDialogFormState() {
  const context = React.useContext(DialogFormContext);
  return context;
}

// Hook for forms to register their state with the dialog
export function useRegisterDialogFormState(isDirty: boolean, isSubmitting: boolean) {
  const context = React.useContext(DialogFormContext);
  
  React.useEffect(() => {
    if (context) {
      context.setIsDirty(isDirty);
      context.setIsSubmitting(isSubmitting);
    }
  }, [context, isDirty, isSubmitting]);
}

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideClose?: boolean;
    preventOutsideClose?: boolean;
  }
>(({ className, children, hideClose, preventOutsideClose, ...props }, ref) => {
  // Internal form state tracking
  const [formIsDirty, setFormIsDirty] = React.useState(false);
  const [formIsSubmitting, setFormIsSubmitting] = React.useState(false);
  
  // Determine if we should prevent closing
  const shouldPreventClose = preventOutsideClose || formIsDirty || formIsSubmitting;
  
  const contextValue = React.useMemo(() => ({
    isDirty: formIsDirty,
    isSubmitting: formIsSubmitting,
    setIsDirty: setFormIsDirty,
    setIsSubmitting: setFormIsSubmitting,
  }), [formIsDirty, formIsSubmitting]);
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg',
          className
        )}
        onPointerDownOutside={(e) => {
          if (shouldPreventClose) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (shouldPreventClose) {
            e.preventDefault();
          }
        }}
        {...props}
      >
        <DialogFormContext.Provider value={contextValue}>
          {children}
        </DialogFormContext.Provider>
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-5 top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground cursor-pointer">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-tight tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
