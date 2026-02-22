import { toast } from 'sonner';

/**
 * Enhanced hook for consistent toast notifications with field-specific messages
 */
export const useToasts = () => {
  const notifySuccess = (message, options = {}) => {
    toast.success(message, {
      duration: 4000,
      ...options
    });
  };

  const notifyError = (error, options = {}) => {
    const message = error instanceof Error ? error.message : error;
    toast.error(message, {
      duration: 6000,
      ...options
    });
  };

  const notifyInfo = (message, options = {}) => {
    toast.info(message, {
      duration: 4000,
      ...options
    });
  };

  const notifyWarning = (message, options = {}) => {
    toast.warning(message, {
      duration: 5000,
      ...options
    });
  };

  const notifyLoading = (message, options = {}) => {
    return toast.loading(message, options);
  };

  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  // Field-specific toast helpers
  const notifyFieldCreated = (fieldName) => {
    toast.success(`Field "${fieldName}" created successfully!`, {
      duration: 4000,
      action: {
        label: 'View',
        onClick: () => console.log('Navigate to field')
      }
    });
  };

  const notifyFieldError = (error) => {
    let message = 'Failed to save field';
    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }
    
    toast.error(message, {
      duration: 6000,
      description: 'Please try again or contact support if the issue persists'
    });
  };

  return {
    toast, // Expose raw toast for custom usage
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    notifyLoading,
    dismiss,
    notifyFieldCreated,
    notifyFieldError
  };
};