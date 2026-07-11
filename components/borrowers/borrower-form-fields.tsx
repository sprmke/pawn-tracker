'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ValidIdUpload } from '@/components/common/valid-id-upload';
import { ESignatureUpload } from '@/components/common/e-signature-upload';

export interface BorrowerFormData {
  name: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface BorrowerFormFieldsProps {
  register: UseFormRegister<BorrowerFormData>;
  errors: FieldErrors<BorrowerFormData>;
  isSubmitting: boolean;
  validIdUrl?: string | null;
  onValidIdUrlChange?: (value: string | null) => void;
  eSignatureUrl?: string | null;
  onESignatureUrlChange?: (value: string | null) => void;
}

export function BorrowerFormFields({
  register,
  errors,
  isSubmitting,
  validIdUrl,
  onValidIdUrlChange,
  eSignatureUrl,
  onESignatureUrlChange,
}: BorrowerFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="borrower-name">Full Name *</Label>
        <Input
          id="borrower-name"
          {...register('name')}
          placeholder="e.g., Juan Dela Cruz"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="borrower-contactNumber">Contact Number</Label>
        <Input
          id="borrower-contactNumber"
          type="tel"
          {...register('contactNumber')}
          placeholder="e.g., +63 912 345 6789"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="borrower-email">Email Address</Label>
        <Input
          id="borrower-email"
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
        <Label htmlFor="borrower-address">Address</Label>
        <Input
          id="borrower-address"
          {...register('address')}
          placeholder="Used on loan contracts"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="borrower-notes">Notes</Label>
        <Textarea
          id="borrower-notes"
          {...register('notes')}
          placeholder="Optional notes about this borrower"
          rows={3}
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
