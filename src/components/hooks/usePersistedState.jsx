import { useState, useEffect } from 'react';

/**
 * Hook to persist state in localStorage
 * @param {string} key - localStorage key
 * @param {*} defaultValue - default value if nothing is stored
 * @returns {[any, function]} - [value, setValue] similar to useState
 */
export const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() => {
    try {
      const persistedValue = localStorage.getItem(key);
      return persistedValue !== null ? JSON.parse(persistedValue) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load persisted state for key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to persist state for key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};