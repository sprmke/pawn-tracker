import { Button } from '@/components/ui/button';

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
    <div className="flex sm:flex-row flex-col items-start justify-between gap-4 mb-6">
      <div className="flex-1">
        <h1 className="text-xl font-semibold">{displayTitle}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {cancelLabel}
        </Button>
        <Button 
          type="button" 
          size="sm"
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {submitLabel || defaultSubmitLabel}
        </Button>
      </div>
    </div>
  );
}
