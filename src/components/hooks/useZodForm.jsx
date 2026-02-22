import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback } from 'react';

/**
 * Custom hook that integrates Zod schema validation with react-hook-form
 * @param {Object} schema - Zod schema for validation
 * @param {Object} options - Additional react-hook-form options
 * @returns {Object} Extended form methods with Zod validation
 */
export const useZodForm = (schema, options = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validate on change for immediate feedback
    ...options
  });

  /**
   * Enhanced handleSubmit that provides better error handling
   * @param {Function} onSubmit - Submit handler function
   * @param {Function} onError - Error handler function
   * @returns {Function} Enhanced submit handler
   */
  const handleSubmit = useCallback((onSubmit, onError) => {
    return form.handleSubmit(
      async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);
        
        try {
          await onSubmit(data);
        } catch (error) {
          setSubmitError(error.message || 'An error occurred during submission');
          if (onError) {
            onError(error);
          }
        } finally {
          setIsSubmitting(false);
        }
      },
      (errors) => {
        setSubmitError('Please correct the validation errors below');
        if (onError) {
          onError(errors);
        }
      }
    );
  }, [form]);

  /**
   * Validates data against the schema without submitting
   * @param {Object} data - Data to validate
   * @returns {{success: boolean, data?: Object, errors?: Object}}
   */
  const validateData = useCallback((data) => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    const errors = result.error.issues.reduce((acc, issue) => {
      const path = issue.path.join('.');
      acc[path] = issue.message;
      return acc;
    }, {});
    
    return { success: false, errors };
  }, [schema]);

  /**
   * Sets form errors from external validation (e.g., API errors)
   * @param {Object} errors - Error object with field paths as keys
   */
  const setExternalErrors = useCallback((errors) => {
    Object.entries(errors).forEach(([path, message]) => {
      form.setError(path, {
        type: 'server',
        message: Array.isArray(message) ? message[0] : message
      });
    });
  }, [form]);

  /**
   * Clears all form errors
   */
  const clearErrors = useCallback(() => {
    form.clearErrors();
    setSubmitError(null);
  }, [form]);

  /**
   * Resets the form to initial state
   */
  const resetForm = useCallback((defaultValues = {}) => {
    form.reset(defaultValues);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [form]);

  return {
    // Original react-hook-form methods
    ...form,
    
    // Enhanced methods
    handleSubmit,
    validateData,
    setExternalErrors,
    clearErrors,
    resetForm,
    
    // Additional state
    isSubmitting,
    submitError,
    
    // Computed values
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    hasErrors: Object.keys(form.formState.errors).length > 0 || !!submitError
  };
};

/**
 * Hook for creating forms with automatic error display components
 * @param {Object} schema - Zod schema for validation
 * @param {Object} options - Form options
 * @returns {Object} Form methods plus error display utilities
 */
export const useZodFormWithErrors = (schema, options = {}) => {
  const form = useZodForm(schema, options);

  /**
   * Gets error message for a specific field
   * @param {string} fieldName - Name of the field
   * @returns {string|null} Error message or null if no error
   */
  const getFieldError = useCallback((fieldName) => {
    const error = form.formState.errors[fieldName];
    return error ? error.message : null;
  }, [form.formState.errors]);

  /**
   * Checks if a field has an error
   * @param {string} fieldName - Name of the field
   * @returns {boolean} Whether the field has an error
   */
  const hasFieldError = useCallback((fieldName) => {
    return !!form.formState.errors[fieldName];
  }, [form.formState.errors]);

  /**
   * Gets all error messages as a flat array
   * @returns {Array<string>} Array of error messages
   */
  const getAllErrors = useCallback(() => {
    const fieldErrors = Object.values(form.formState.errors)
      .map(error => error.message)
      .filter(Boolean);
    
    const submitErrors = form.submitError ? [form.submitError] : [];
    
    return [...fieldErrors, ...submitErrors];
  }, [form.formState.errors, form.submitError]);

  return {
    ...form,
    getFieldError,
    hasFieldError,
    getAllErrors
  };
};

/**
 * Type-safe form hook that ensures proper TypeScript inference
 * In a TypeScript environment, this would provide full type safety
 * @param {Object} schema - Zod schema
 * @param {Object} options - Form options
 * @returns {Object} Typed form methods
 */
export const useTypedZodForm = (schema, options = {}) => {
  return useZodForm(schema, options);
};