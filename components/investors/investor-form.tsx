'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Investor } from '@/lib/types';
import { FormHeader } from '@/components/common';
import { InvestorFormFields, InvestorFormData } from './investor-form-fields';

const investorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  contactNumber: z.string().optional(),
});

interface InvestorFormProps {
  existingInvestor?: Investor;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvestorForm({
  existingInvestor,
  onSuccess,
  onCancel,
}: InvestorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!existingInvestor;
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvestorFormData>({
    resolver: zodResolver(investorSchema),
    defaultValues: existingInvestor
      ? {
          name: existingInvestor.name,
          email: existingInvestor.email,
          contactNumber: existingInvestor.contactNumber || '',
        }
      : {
          name: '',
          email: '',
          contactNumber: '',
        },
  });

  const onSubmit = async (data: z.infer<typeof investorSchema>) => {
    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/investors/${existingInvestor.id}`
        : '/api/investors';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditMode ? 'update' : 'create'} investor`
        );
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/investors');
        router.refresh();
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} investor:`,
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${
              isEditMode ? 'update' : 'create'
            } investor. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = () => {
    formRef.current?.requestSubmit();
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
        title={isEditMode ? existingInvestor.name : 'Create Investor'}
        description={
          isEditMode
            ? 'Update investor information'
            : 'Add a new investor to the system'
        }
        onCancel={handleCancelClick}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
        submitLabel={
          isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
            ? 'Update Investor'
            : 'Create Investor'
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Investor Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InvestorFormFields
            register={register}
            errors={errors}
            isSubmitting={isSubmitting}
          />

          {isEditMode && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Changing investor information will not
                affect existing loan allocations or transaction history.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelClick}
          className="flex-1 w-full"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 w-full">
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
            ? 'Update Investor'
            : 'Create Investor'}
        </Button>
      </div>
    </form>
  );
}
