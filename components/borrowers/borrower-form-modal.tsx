'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  useRegisterDialogFormState,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BorrowerFormFields, BorrowerFormData } from './borrower-form-fields';
import type { Borrower } from '@/lib/types';
import { normalizeValidIdUrl, normalizeSignatureImageUrl } from '@/lib/valid-id-document';

const borrowerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  contactNumber: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

interface BorrowerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (borrower: Borrower) => void;
}

export function BorrowerFormModal({
  open,
  onOpenChange,
  onSuccess,
}: BorrowerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validIdUrl, setValidIdUrl] = useState<string | null>(null);
  const [eSignatureUrl, setESignatureUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<BorrowerFormData>({
    resolver: zodResolver(borrowerSchema),
    defaultValues: {
      name: '',
      contactNumber: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  useRegisterDialogFormState(isDirty, isSubmitting);

  const onSubmit = async (data: z.infer<typeof borrowerSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/borrowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          contactNumber: data.contactNumber || null,
          email: data.email || null,
          address: data.address || null,
          notes: data.notes || null,
          validIdUrl: normalizeValidIdUrl(validIdUrl),
          eSignatureUrl: normalizeSignatureImageUrl(eSignatureUrl),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create borrower');
      }

      const newBorrower = await response.json();
      reset();
      setValidIdUrl(null);
      setESignatureUrl(null);
      onOpenChange(false);
      onSuccess(newBorrower);
    } catch (error) {
      console.error('Error creating borrower:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create borrower. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setValidIdUrl(null);
    setESignatureUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Borrower</DialogTitle>
          <DialogDescription>
            Create a new borrower profile to assign to this loan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <BorrowerFormFields
            register={register}
            errors={errors}
            isSubmitting={isSubmitting}
            validIdUrl={validIdUrl}
            onValidIdUrlChange={setValidIdUrl}
            eSignatureUrl={eSignatureUrl}
            onESignatureUrlChange={setESignatureUrl}
          />

          <div className="flex flex-col-reverse md:flex-row gap-1.5 md:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 h-9 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-9 text-sm"
            >
              {isSubmitting ? 'Creating...' : 'Create Borrower'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
