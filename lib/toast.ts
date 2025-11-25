import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export function toast(message: string, options?: ToastOptions) {
  const { type = 'info', duration = 4000, description } = options || {};

  switch (type) {
    case 'success':
      return sonnerToast.success(message, { description, duration });
    case 'error':
      return sonnerToast.error(message, { description, duration });
    case 'warning':
      return sonnerToast.warning(message, { description, duration });
    case 'info':
    default:
      return sonnerToast.info(message, { description, duration });
  }
}

// Convenience methods
toast.success = (message: string, description?: string, duration?: number) =>
  toast(message, { type: 'success', description, duration });

toast.error = (message: string, description?: string, duration?: number) =>
  toast(message, { type: 'error', description, duration });

toast.warning = (message: string, description?: string, duration?: number) =>
  toast(message, { type: 'warning', description, duration });

toast.info = (message: string, description?: string, duration?: number) =>
  toast(message, { type: 'info', description, duration });



