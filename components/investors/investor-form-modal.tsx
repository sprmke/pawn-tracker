'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const investorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

interface InvestorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (investor: { id: number; name: string; email: string }) => void;
}

export function InvestorFormModal({
  open,
  onOpenChange,
  onSuccess,
}: InvestorFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(investorSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof investorSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create investor');
      }

      const newInvestor = await response.json();

      // Reset form and close modal
      reset();
      onOpenChange(false);

      // Call success callback with the new investor
      onSuccess(newInvestor);
    } catch (error) {
      console.error('Error creating investor:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to create investor. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Investor</DialogTitle>
          <DialogDescription>
            Create a new investor profile to add to this loan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-name">Full Name *</Label>
            <Input
              id="modal-name"
              {...register('name')}
              placeholder="e.g., Juan Dela Cruz"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-email">Email Address *</Label>
            <Input
              id="modal-email"
              type="email"
              {...register('email')}
              placeholder="e.g., juan@example.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : 'Create Investor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
