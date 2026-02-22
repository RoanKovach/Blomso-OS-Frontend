import { useState, useEffect } from 'react';
import { useConnectionStatus } from './useConnectionStatus';
import { useToasts } from './useToasts';

const OFFLINE_MUTATIONS_KEY = 'blomso_offline_mutations';

/**
 * Hook to manage offline mutation queueing and synchronization
 */
export const useOfflineMutations = () => {
  const [pendingMutations, setPendingMutations] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline } = useConnectionStatus();
  const { notifySuccess, notifyError, notifyInfo } = useToasts();

  // Load pending mutations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_MUTATIONS_KEY);
      if (stored) {
        const mutations = JSON.parse(stored);
        setPendingMutations(mutations);
      }
    } catch (error) {
      console.error('Failed to load offline mutations:', error);
    }
  }, []);

  // Save pending mutations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(pendingMutations));
    } catch (error) {
      console.error('Failed to save offline mutations:', error);
    }
  }, [pendingMutations]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingMutations.length > 0 && !isSyncing) {
      syncPendingMutations();
    }
  }, [isOnline, pendingMutations, isSyncing]);

  /**
   * Queue a mutation for offline execution
   */
  const queueMutation = (mutation) => {
    const queuedMutation = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...mutation
    };

    setPendingMutations(prev => [...prev, queuedMutation]);
    
    if (!isOnline) {
      notifyInfo(`Action queued for when you're back online: ${mutation.description || 'Unknown action'}`);
    }

    return queuedMutation.id;
  };

  /**
   * Remove a mutation from the queue
   */
  const removeMutation = (mutationId) => {
    setPendingMutations(prev => prev.filter(m => m.id !== mutationId));
  };

  /**
   * Sync all pending mutations
   */
  const syncPendingMutations = async () => {
    if (!isOnline || pendingMutations.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    let failureCount = 0;

    // We need to dynamically import the service methods to avoid circular dependencies
    const { FieldService } = await import('../services/fieldService');
    const mutationFunctions = {
        createField: (vars) => FieldService.createField(vars),
        updateField: (vars) => FieldService.updateField(vars.fieldId, vars.updateData),
        deleteField: (vars) => FieldService.deleteField(vars),
    };

    for (const mutation of pendingMutations) {
      try {
        const mutationFn = mutationFunctions[mutation.type];
        if (mutationFn) {
          await mutationFn(mutation.variables);
          removeMutation(mutation.id);
          successCount++;
        } else {
          console.warn('Unknown mutation type in queue:', mutation.type);
          removeMutation(mutation.id); // Remove invalid mutations
        }
      } catch (error) {
        console.error('Failed to sync mutation:', error);
        failureCount++;
        
        const mutationAge = Date.now() - new Date(mutation.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (mutationAge > maxAge) {
          removeMutation(mutation.id);
          failureCount--;
          console.log('Removed stale offline mutation:', mutation.id);
        }
      }
    }

    setIsSyncing(false);

    if (successCount > 0) {
      notifySuccess(`Synced ${successCount} offline action${successCount === 1 ? '' : 's'}`);
    }
    if (failureCount > 0) {
      notifyError(`Failed to sync ${failureCount} action${failureCount === 1 ? '' : 's'}`);
    }
  };

  return {
    pendingMutations,
    queueMutation,
    removeMutation,
    syncPendingMutations,
    isSyncing,
    hasPendingMutations: pendingMutations.length > 0
  };
};