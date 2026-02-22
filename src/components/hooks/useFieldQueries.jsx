
import { useState, useEffect, useCallback } from 'react';
import { FieldService } from '../services/fieldService';
import { useToasts } from './useToasts';

/**
 * Hook to fetch all user fields with refetch capability
 */
export const useGetFields = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFields = useCallback(async () => {
    try {
      setIsLoading(true);
      const fields = await FieldService.getUserFields();
      setData(fields);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Error fetching fields:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array as fetchFields doesn't depend on any external state

  useEffect(() => {
    fetchFields();
  }, [fetchFields]); // Dependency array includes fetchFields to re-run effect if it changes (though useCallback makes it stable)

  return { data, isLoading, error, refetch: fetchFields };
};

/**
 * Hook to create a new field with optimistic updates
 */
export const useCreateField = () => {
  const { notifySuccess, notifyError } = useToasts();
  const [isPending, setIsPending] = useState(false);

  const mutate = async (fieldData) => {
    setIsPending(true);
    try {
      const newField = await FieldService.createField(fieldData);
      notifySuccess(`Field "${newField.field_name}" created successfully!`);
      return newField;
    } catch (error) {
      notifyError(`Failed to create field: ${error.message}`);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};

/**
 * Hook to update an existing field
 */
export const useUpdateField = () => {
  const { notifySuccess, notifyError } = useToasts();
  const [isPending, setIsPending] = useState(false);

  const mutate = async ({ fieldId, updateData }) => {
    setIsPending(true);
    try {
      const updatedField = await FieldService.updateField(fieldId, updateData);
      notifySuccess(`Field "${updatedField.field_name}" updated successfully!`);
      return updatedField;
    } catch (error) {
      notifyError(`Failed to update field: ${error.message}`);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};

/**
 * Hook to delete a field
 */
export const useDeleteField = () => {
  const { notifySuccess, notifyError } = useToasts();
  const [isPending, setIsPending] = useState(false);

  const mutate = async (fieldId) => {
    setIsPending(true);
    try {
      await FieldService.deleteField(fieldId);
      notifySuccess('Field deleted successfully!');
    } catch (error) {
      notifyError(`Failed to delete field: ${error.message}`);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};
