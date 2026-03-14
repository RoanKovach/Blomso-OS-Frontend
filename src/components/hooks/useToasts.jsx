import { toast as sonnerToast } from 'sonner';

const noopToast = Object.assign(() => {}, {
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
  loading: () => () => {},
  dismiss: () => {},
});
const safeToast =
  sonnerToast && (typeof sonnerToast === 'function' || typeof sonnerToast.success === 'function')
    ? sonnerToast
    : noopToast;

/**
 * Enhanced hook for consistent toast notifications with field-specific messages
 */
export const useToasts = () => {
  const toast = safeToast;
  const notifySuccess = (message, options = {}) => {
    if (typeof toast.success === 'function') toast.success(message, { duration: 4000, ...options });
  };

  const notifyError = (error, options = {}) => {
    const message = error instanceof Error ? error.message : error;
    if (typeof toast.error === 'function') toast.error(message, {
      duration: 6000,
      ...options
    });
  };

  const notifyInfo = (message, options = {}) => {
    if (typeof toast.info === 'function') toast.info(message, { duration: 4000, ...options });
  };

  const notifyWarning = (message, options = {}) => {
    if (typeof toast.warning === 'function') toast.warning(message, { duration: 5000, ...options });
  };

  const notifyLoading = (message, options = {}) => {
    return typeof toast.loading === 'function' ? toast.loading(message, options) : () => {};
  };

  const dismiss = (toastId) => {
    if (typeof toast.dismiss === 'function') toast.dismiss(toastId);
  };

  // Field-specific toast helpers
  const notifyFieldCreated = (fieldName) => {
    if (typeof toast.success === 'function') toast.success(`Field "${fieldName}" created successfully!`, {
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
    if (typeof toast.error === 'function') toast.error(message, {
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