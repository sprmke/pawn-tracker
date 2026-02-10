'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DownloadBackupButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function DownloadBackupButton({
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
}: DownloadBackupButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [justDownloaded, setJustDownloaded] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    setJustDownloaded(false);

    try {
      const response = await fetch('/api/backup?download=true');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create backup');
      }

      // Get the filename from the Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `pawn-tracker-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setJustDownloaded(true);
      toast.success('Backup downloaded successfully', {
        description: `Saved as ${filename}`,
      });

      // Reset the checkmark after 3 seconds
      setTimeout(() => {
        setJustDownloaded(false);
      }, 3000);
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getIcon = () => {
    if (isDownloading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (justDownloaded) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <Download className="h-4 w-4" />;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      {getIcon()}
      {showLabel && (
        <span className="ml-2">
          {isDownloading
            ? 'Downloading...'
            : justDownloaded
              ? 'Downloaded!'
              : 'Download Backup'}
        </span>
      )}
    </Button>
  );
}
