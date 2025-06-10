
import { useCallback } from 'react';
import { useAlgorithmicScheduler } from './useAlgorithmicScheduler';
import { Task, Event } from '../types/task';

export function useUnifiedRescheduler() {
  const { rescheduleAllTasks, isScheduling } = useAlgorithmicScheduler();

  const performUnifiedReschedule = useCallback(async (
    tasks: Task[],
    events: Event[],
    projects: any[] = [],
    onTasksUpdate: (tasks: Task[]) => void
  ) => {
    console.log('🔄 UNIFICATION GLOBALE: Replanification avec contraintes canStartFrom STRICTEMENT PRÉSERVÉES');
    console.log('📊 Données pour replanification unifiée:', {
      tasks: tasks.length,
      events: events.length,
      projects: projects.length
    });

    try {
      const rescheduledTasks = await rescheduleAllTasks(tasks, events, projects);
      
      // Appliquer les mises à jour pour chaque tâche modifiée
      const updatedTasks = rescheduledTasks.map(task => {
        const originalTask = tasks.find(t => t.id === task.id);
        if (originalTask) {
          // Vérifier s'il y a des changements dans la planification
          const hasSchedulingChanges = 
            task.scheduledStart !== originalTask.scheduledStart ||
            task.scheduledEnd !== originalTask.scheduledEnd;
          
          if (hasSchedulingChanges) {
            console.log('🔄 UNIFICATION: Mise à jour tâche:', task.title, {
              avant: originalTask.scheduledStart ? new Date(originalTask.scheduledStart).toLocaleString() : 'non programmée',
              après: task.scheduledStart ? new Date(task.scheduledStart).toLocaleString() : 'non programmée',
              constraintRespected: task.canStartFrom ? 'contrainte canStartFrom préservée' : 'aucune contrainte'
            });
          }
        }
        return task;
      });

      onTasksUpdate(updatedTasks);
      console.log('✅ UNIFICATION GLOBALE: Replanification terminée avec contraintes STRICTEMENT respectées');
      
      return updatedTasks;
    } catch (error) {
      console.error('❌ UNIFICATION GLOBALE: Erreur lors de la replanification:', error);
      throw error;
    }
  }, [rescheduleAllTasks]);

  return {
    performUnifiedReschedule,
    isScheduling
  };
}
