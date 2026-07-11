'use client';

import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { readValidIdFileAsDataUrl } from '@/lib/valid-id-document';
import { toast } from '@/lib/toast';
import { Upload, X } from 'lucide-react';

interface ValidIdUploadProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  idPrefix?: string;
}

export function ValidIdUpload({
  value,
  onChange,
  disabled = false,
  label = 'Valid ID',
  description = 'Upload a photo of a government-issued ID. It will appear on loan contracts.',
  idPrefix,
}: ValidIdUploadProps) {
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
      const dataUrl = await readValidIdFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload valid ID.',
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
          <div className="overflow-hidden rounded-md border border-border bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Valid ID preview"
              className="max-h-48 w-full object-contain"
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
              Replace ID
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
          {isProcessing ? 'Processing...' : 'Upload valid ID'}
        </Button>
      )}

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
