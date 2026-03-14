import { useState, useEffect, useCallback } from 'react';
import { Field } from '@/api/entities';

/**
 * Hook to manage all field operations using the built-in Entity SDK.
 * This version is self-contained and removes the invalid @tanstack/react-query dependency.
 */
export const useFieldOperations = () => {
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch or refresh the list of fields (GET /fields returns { ok: true, fields: [...] })
  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await Field.list('-created_date'); // Uses auth token from client.js
      const list = Array.isArray(raw) ? raw : (raw?.fields ?? raw?.items ?? raw?.data ?? []);
      setFields(list);
      setError(null);
    } catch (e) {
      setError(e);
      console.error("Failed to fetch fields", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch fields on initial mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Function to create a new field
  const createField = async (payload) => {
    setIsCreating(true);
    try {
      const newField = await Field.create(payload);
      // After creating, refetch the list to include the new field.
      await refetch();
      return newField;
    } catch (e) {
      console.error("Failed to create field", e);
      throw e; // Rethrow to be caught by the calling component for user feedback
    } finally {
      setIsCreating(false);
    }
  };

  // Function to delete a field
  const deleteField = async (fieldId) => {
    setIsDeleting(true);
    try {
      await Field.delete(fieldId);
      // After deleting, refetch the list.
      await refetch();
    } catch(e) {
      console.error("Failed to delete field", e);
      throw e;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    fields: fields || [],
    isLoading,
    error,
    refetch,
    createField,
    deleteField,
    isCreating,
    isUpdating,
    isDeleting,
  };
};