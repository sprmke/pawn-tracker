'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface InvestorFormData {
  name: string;
  email: string;
  contactNumber?: string;
}

interface InvestorFormFieldsProps {
  register: UseFormRegister<InvestorFormData>;
  errors: FieldErrors<InvestorFormData>;
  isSubmitting: boolean;
}

export function InvestorFormFields({
  register,
  errors,
  isSubmitting,
}: InvestorFormFieldsProps) {
  return (
    <>
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
          <p className="text-sm text-red-600">{errors.contactNumber.message}</p>
        )}
      </div>
    </>
  );
}
