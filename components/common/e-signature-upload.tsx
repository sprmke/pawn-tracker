'use client';

import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { readSignatureImageFileAsDataUrl } from '@/lib/valid-id-document';
import { toast } from '@/lib/toast';
import { PenLine, Upload, X } from 'lucide-react';

interface ESignatureUploadProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  idPrefix?: string;
}

export function ESignatureUpload({
  value,
  onChange,
  disabled = false,
  label = 'E-Signature',
  description = 'Upload a signature image. It will appear on loan contracts.',
  idPrefix,
}: ESignatureUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputId = idPrefix ? `${idPrefix}-file` : undefined;

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setIsProcessing(true);
    try {
      const dataUrl = await readSignatureImageFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload signature.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>

      {value ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-md border border-border bg-white px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="E-signature preview"
              className="max-h-24 w-full object-contain object-left"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isProcessing}
              onClick={() => inputRef.current?.click()}
            >
              Replace signature
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isProcessing}
              onClick={() => onChange(null)}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          disabled={disabled || isProcessing}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing ? 'Processing...' : 'Upload e-signature'}
        </Button>
      )}

      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <PenLine className="h-3 w-3" />
        PNG or JPG with a clear signature on white background works best.
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        disabled={disabled || isProcessing}
        onChange={handleFileChange}
      />
    </div>
  );
}
