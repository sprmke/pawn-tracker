'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormHeader } from '@/components/common';
import type { Borrower } from '@/lib/types';
import {
  normalizeValidIdUrl,
  normalizeSignatureImageUrl,
} from '@/lib/valid-id-document';
import { BorrowerFormFields, BorrowerFormData } from './borrower-form-fields';

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

interface BorrowerFormProps {
  existingBorrower?: Borrower;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BorrowerForm({
  existingBorrower,
  onSuccess,
  onCancel,
}: BorrowerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validIdUrl, setValidIdUrl] = useState<string | null>(
    existingBorrower?.validIdUrl ?? null,
  );
  const [eSignatureUrl, setESignatureUrl] = useState<string | null>(
    existingBorrower?.eSignatureUrl ?? null,
  );
  const isEditMode = !!existingBorrower;
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BorrowerFormData>({
    resolver: zodResolver(borrowerSchema),
    defaultValues: existingBorrower
      ? {
          name: existingBorrower.name,
          contactNumber: existingBorrower.contactNumber || '',
          email: existingBorrower.email || '',
          address: existingBorrower.address || '',
          notes: existingBorrower.notes || '',
        }
      : {
          name: '',
          contactNumber: '',
          email: '',
          address: '',
          notes: '',
        },
  });

  const onSubmit = async (data: z.infer<typeof borrowerSchema>) => {
    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/borrowers/${existingBorrower.id}`
        : '/api/borrowers';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
        throw new Error(
          errorData.error ||
            `Failed to ${isEditMode ? 'update' : 'create'} borrower`,
        );
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
        router.refresh();
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} borrower:`,
        error,
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${
              isEditMode ? 'update' : 'create'
            } borrower. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormHeader
        title={isEditMode ? existingBorrower.name : 'Create Borrower'}
        description={
          isEditMode
            ? 'Update borrower information'
            : 'Add a new borrower profile'
        }
        onCancel={handleCancelClick}
        onSubmit={() => formRef.current?.requestSubmit()}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
        submitLabel={
          isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Borrower'
              : 'Create Borrower'
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Borrower Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BorrowerFormFields
            register={register}
            errors={errors}
            isSubmitting={isSubmitting}
            validIdUrl={validIdUrl}
            onValidIdUrlChange={setValidIdUrl}
            eSignatureUrl={eSignatureUrl}
            onESignatureUrlChange={setESignatureUrl}
          />

          {isEditMode && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Updating borrower information will not
                change existing loan records.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelClick}
          className="w-full flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full flex-1">
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Borrower'
              : 'Create Borrower'}
        </Button>
      </div>
    </form>
  );
}
