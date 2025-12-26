import { Button } from '@/components/ui/button';

// Common button style for form actions
const formBtnClass = 'flex-1 md:flex-none h-8 px-3 text-xs md:text-sm';

interface FormHeaderProps {
  title: string;
  description?: string;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isEditMode: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormHeader({
  title,
  description,
  onCancel,
  onSubmit,
  isSubmitting,
  isEditMode,
  submitLabel,
  cancelLabel = 'Cancel',
}: FormHeaderProps) {
  const defaultSubmitLabel = isSubmitting
    ? isEditMode
      ? 'Updating...'
      : 'Creating...'
    : isEditMode
    ? 'Update'
    : 'Create';

  const displayTitle = isEditMode ? `Edit - ${title}` : title;

  return (
    <div className="flex md:flex-row flex-col items-start justify-between gap-3 md:gap-4 mb-6">
      <div className="flex-1">
        <h1 className="text-lg md:text-xl font-semibold">{displayTitle}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 w-full md:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className={formBtnClass}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={formBtnClass}
        >
          {submitLabel || defaultSubmitLabel}
        </Button>
      </div>
    </div>
  );
}
