
import { useCallback } from 'react';
import { Task } from '../types/task';

export function useTaskDependencyCleanup() {
  const cleanupInvalidDependencies = useCallback((tasks: Task[]): Task[] => {
    const taskIds = new Set(tasks.map(task => task.id));
    let hasChanges = false;
    
    const cleanedTasks = tasks.map(task => {
      if (task.dependencies && task.dependencies.length > 0) {
        const validDependencies = task.dependencies.filter(depId => {
          const isValid = taskIds.has(depId);
          if (!isValid) {
            console.warn(`🧹 Suppression de la dépendance invalide ${depId} de la tâche ${task.title}`);
            hasChanges = true;
          }
          return isValid;
        });
        
        if (validDependencies.length !== task.dependencies.length) {
          console.log(`🔧 Nettoyage des dépendances pour ${task.title}: ${task.dependencies.length} -> ${validDependencies.length}`);
          return {
            ...task,
            dependencies: validDependencies
          };
        }
      }
      
      return task;
    });
    
    return cleanedTasks;
  }, []);

  return { cleanupInvalidDependencies };
}
