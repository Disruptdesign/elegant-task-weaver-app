
import { useMemo, useCallback, useRef } from 'react';

// Cache intelligent pour les données fréquemment utilisées
export const usePerformanceCache = () => {
  const cacheRef = useRef(new Map());

  const getFromCache = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const setToCache = useCallback((key: string, value: any, ttl = 300000) => { // 5 minutes par défaut
    const expiry = Date.now() + ttl;
    cacheRef.current.set(key, { value, expiry });
  }, []);

  const isExpired = useCallback((key: string) => {
    const cached = cacheRef.current.get(key);
    return cached && Date.now() > cached.expiry;
  }, []);

  const getCachedData = useCallback((key: string, fetchFunction: () => any) => {
    const cached = getFromCache(key);
    
    if (cached && !isExpired(key)) {
      return cached.value;
    }
    
    const data = fetchFunction();
    setToCache(key, data);
    return data;
  }, [getFromCache, setToCache, isExpired]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const clearExpiredEntries = useCallback(() => {
    cacheRef.current.forEach((value, key) => {
      if (isExpired(key)) {
        cacheRef.current.delete(key);
      }
    });
  }, [isExpired]);

  return {
    getCachedData,
    setToCache,
    getFromCache,
    clearCache,
    clearExpiredEntries
  };
};
