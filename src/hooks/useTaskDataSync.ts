
import { useEffect } from 'react';
import { Task, Event, Project } from '../types/task';
import { useTaskDependencyCleanup } from './useTaskDependencyCleanup';
import { useDataValidation } from './useDataValidation';

interface UseTaskDataSyncProps {
  tasks: Task[];
  events: Event[];
  projects: Project[];
  onTasksUpdate: (tasks: Task[]) => void;
}

export function useTaskDataSync({ tasks, events, projects, onTasksUpdate }: UseTaskDataSyncProps) {
  const { cleanupInvalidDependencies } = useTaskDependencyCleanup();
  const { validateAndLogData } = useDataValidation();

  useEffect(() => {
    if (tasks.length === 0) return;

    console.log('🔄 Synchronisation des données en cours...');
    
    // Valider les données actuelles
    const validation = validateAndLogData(tasks, events, projects);
    
    if (!validation.isValid) {
      console.log('🔧 Correction des données invalides détectées');
      
      // Nettoyer les dépendances invalides
      const cleanedTasks = cleanupInvalidDependencies(tasks);
      
      // Mettre à jour les tâches si des changements ont été effectués
      const hasChanges = cleanedTasks.some((task, index) => 
        JSON.stringify(task.dependencies) !== JSON.stringify(tasks[index].dependencies)
      );
      
      if (hasChanges) {
        console.log('✅ Mise à jour des tâches avec des dépendances corrigées');
        onTasksUpdate(cleanedTasks);
      }
    } else {
      console.log('✅ Toutes les données sont valides');
    }
  }, [tasks, events, projects]);

  return { validateAndLogData };
}
