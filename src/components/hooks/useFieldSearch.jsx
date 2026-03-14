import { useMemo, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';

/**
 * Simple fuzzy search implementation as fallback for Fuse.js
 */
const simpleSearch = (items, query, keys) => {
  if (!query || query.trim().length === 0) {
    return items;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return items.filter(item => {
    return keys.some(key => {
      const value = getNestedValue(item, key);
      return value && value.toLowerCase().includes(searchTerm);
    });
  });
};

/**
 * Helper function to get nested object values
 */
const getNestedValue = (obj, path) => {
  if (typeof path === 'string') {
    return obj[path];
  }
  
  if (typeof path === 'object' && path.name) {
    return obj[path.name];
  }
  
  return null;
};

/**
 * Hook for fuzzy searching fields with search term persistence
 * Fallback implementation without Fuse.js
 */
export const useFieldSearch = (fields = [], initialQuery = '') => {
  const list = Array.isArray(fields) ? fields : [];
  // Persist recent search terms
  const [recentSearches, setRecentSearches] = usePersistedState('blomso_recent_searches', []);
  const [searchQuery, setSearchQuery] = usePersistedState('blomso_current_search', initialQuery);

  const searchResults = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return list;
    }

    // Define search keys
    const searchKeys = [
      'field_name',
      'farm_name', 
      'current_crop',
      'soil_type',
      'farming_method'
    ];

    try {
      // Try to use Fuse.js if available (for future enhancement)
      if (typeof window !== 'undefined' && window.Fuse) {
        const fuse = new window.Fuse(list, {
          keys: searchKeys.map(key => ({ name: key, weight: key === 'field_name' ? 0.7 : 0.3 })),
          threshold: 0.4,
          includeScore: true,
          includeMatches: true,
          minMatchCharLength: 2
        });
        
        const results = fuse.search(searchQuery);
        return results.map(result => ({
          ...result.item,
          _searchScore: result.score,
          _searchMatches: result.matches
        }));
      }

      // Fallback to simple search
      return simpleSearch(list, searchQuery, searchKeys);

    } catch (error) {
      console.warn('Search error, falling back to simple search:', error);
      return simpleSearch(list, searchQuery, searchKeys);
    }
  }, [list, searchQuery]);

  const updateSearchQuery = useCallback((newQuery) => {
    setSearchQuery(newQuery);
    
    // Add to recent searches if it's a meaningful search
    if (newQuery && newQuery.trim().length >= 2) {
      setRecentSearches(prev => {
        const filtered = prev.filter(term => term !== newQuery.trim());
        return [newQuery.trim(), ...filtered].slice(0, 10); // Keep last 10 searches
      });
    }
  }, [setSearchQuery, setRecentSearches]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  return {
    searchResults,
    searchQuery,
    updateSearchQuery,
    clearSearch,
    recentSearches,
    clearRecentSearches,
    isSearching: Boolean(searchQuery && searchQuery.trim())
  };
};