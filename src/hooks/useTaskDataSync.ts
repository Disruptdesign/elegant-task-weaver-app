
import { useEffect, useCallback } from 'react';
import { Task, Event, Project } from '../types/task';

interface UseTaskDataSyncProps {
  tasks: Task[];
  events: Event[];
  projects: Project[];
  onTasksUpdate: (tasks: Task[]) => void;
}

export function useTaskDataSync({ tasks, events, projects, onTasksUpdate }: UseTaskDataSyncProps) {
  
  const cleanupInvalidDependencies = useCallback((tasksToClean: Task[]): Task[] => {
    const taskIds = new Set(tasksToClean.map(task => task.id));
    let hasChanges = false;
    
    const cleanedTasks = tasksToClean.map(task => {
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
    
    return hasChanges ? cleanedTasks : tasksToClean;
  }, []);

  const validateAndLogData = useCallback((tasksToValidate: Task[]) => {
    const taskIds = new Set(tasksToValidate.map(t => t.id));
    let hasInvalidDependencies = false;
    
    tasksToValidate.forEach(task => {
      if (task.dependencies) {
        const invalidDeps = task.dependencies.filter(depId => !taskIds.has(depId));
        if (invalidDeps.length > 0) {
          console.warn(`⚠️ Dépendances invalides dans ${task.title}:`, invalidDeps);
          hasInvalidDependencies = true;
        }
      }
    });

    return {
      isValid: !hasInvalidDependencies,
      issues: {
        invalidDependencies: hasInvalidDependencies,
        totalTasks: tasksToValidate.length,
        totalProjects: projects.length
      }
    };
  }, [projects.length]);

  useEffect(() => {
    if (tasks.length === 0) {
      console.log('⚠️ Aucune tâche à synchroniser');
      return;
    }

    console.log('🔄 Vérification de la synchronisation des données...');
    
    // Vérifier s'il y a des dépendances invalides
    const validation = validateAndLogData(tasks);
    
    if (!validation.isValid) {
      console.log('🔧 Correction des dépendances invalides détectées');
      
      // Nettoyer les dépendances invalides
      const cleanedTasks = cleanupInvalidDependencies(tasks);
      
      // Si des changements ont été effectués, mettre à jour
      if (cleanedTasks !== tasks) {
        console.log('✅ Mise à jour des tâches avec des dépendances corrigées');
        onTasksUpdate(cleanedTasks);
      }
    } else {
      console.log('✅ Toutes les dépendances sont valides');
    }
  }, [tasks, cleanupInvalidDependencies, validateAndLogData, onTasksUpdate]);

  return { validateAndLogData };
}
