'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValidIdUpload } from '@/components/common/valid-id-upload';
import { ESignatureUpload } from '@/components/common/e-signature-upload';

export interface InvestorFormData {
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
}

interface InvestorFormFieldsProps {
  register: UseFormRegister<InvestorFormData>;
  errors: FieldErrors<InvestorFormData>;
  isSubmitting: boolean;
  validIdUrl?: string | null;
  onValidIdUrlChange?: (value: string | null) => void;
  eSignatureUrl?: string | null;
  onESignatureUrlChange?: (value: string | null) => void;
}

export function InvestorFormFields({
  register,
  errors,
  isSubmitting,
  validIdUrl,
  onValidIdUrlChange,
  eSignatureUrl,
  onESignatureUrlChange,
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

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          {...register('address')}
          placeholder="Used on loan contracts"
          disabled={isSubmitting}
        />
      </div>

      {onValidIdUrlChange ? (
        <ValidIdUpload
          value={validIdUrl}
          onChange={onValidIdUrlChange}
          disabled={isSubmitting}
        />
      ) : null}

      {onESignatureUrlChange ? (
        <ESignatureUpload
          value={eSignatureUrl}
          onChange={onESignatureUrlChange}
          disabled={isSubmitting}
        />
      ) : null}
    </>
  );
}
