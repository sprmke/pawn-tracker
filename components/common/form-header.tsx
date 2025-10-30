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
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1">
        <h1 className="text-xl sm:text-2xl font-bold">{displayTitle}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {submitLabel || defaultSubmitLabel}
        </Button>
      </div>
    </div>
  );
}
