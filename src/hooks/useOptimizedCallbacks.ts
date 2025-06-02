
import { useCallback, useMemo } from 'react';

// Hook pour optimiser les callbacks et éviter les re-rendus inutiles
export const useOptimizedCallbacks = (handlers: any) => {
  const optimizedHandlers = useMemo(() => {
    const optimized: any = {};
    
    Object.keys(handlers).forEach(key => {
      optimized[key] = handlers[key];
    });
    
    return optimized;
  }, [handlers]);

  return optimizedHandlers;
};

// Hook pour mémoriser les props complexes
export const useStableProps = <T extends Record<string, any>>(props: T): T => {
  return useMemo(() => props, [
    // Utilisation de JSON.stringify pour une comparaison profonde simple
    JSON.stringify(props)
  ]);
};
