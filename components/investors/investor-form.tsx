'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Investor } from '@/lib/types';

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
}

export function InvestorForm({
  existingInvestor,
  onSuccess,
}: InvestorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!existingInvestor;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
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
      alert(
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Investor Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Juan Dela Cruz"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="e.g., juan@example.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              type="tel"
              {...register('contactNumber')}
              placeholder="e.g., +63 912 345 6789"
              disabled={isSubmitting}
            />
            {errors.contactNumber && (
              <p className="text-sm text-red-600">
                {errors.contactNumber.message}
              </p>
            )}
          </div>

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
          onClick={() => router.back()}
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
