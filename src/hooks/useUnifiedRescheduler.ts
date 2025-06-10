
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
      // CORRECTION CRITIQUE: Forcer la replanification en mode STRICT avec préservation des contraintes
      const rescheduledTasks = await rescheduleAllTasks(tasks, events, projects, {
        autoSchedule: true,
        workingHours: {
          start: "09:00",
          end: "18:00"
        },
        bufferBetweenTasks: 15,
        allowWeekends: false
      });
      
      // VÉRIFICATION CRITIQUE: S'assurer qu'aucune tâche ne viole sa contrainte canStartFrom
      const correctedTasks = rescheduledTasks.map(task => {
        if (task.canStartFrom && task.scheduledStart) {
          const canStartFromDate = new Date(task.canStartFrom);
          const scheduledStartDate = new Date(task.scheduledStart);
          
          if (scheduledStartDate < canStartFromDate) {
            console.log('🚨 CORRECTION FORCÉE: Tâche', task.title, 'programmée avant sa contrainte');
            console.log('   Programmée à:', scheduledStartDate.toLocaleString());
            console.log('   Contrainte à:', canStartFromDate.toLocaleString());
            
            // Corriger en reprogrammant à la date de contrainte minimum
            return {
              ...task,
              scheduledStart: canStartFromDate,
              scheduledEnd: new Date(canStartFromDate.getTime() + task.estimatedDuration * 60000)
            };
          }
        }
        return task;
      });
      
      // Appliquer les mises à jour pour chaque tâche modifiée
      const updatedTasks = correctedTasks.map(task => {
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
              constraintRespected: task.canStartFrom ? 'contrainte canStartFrom VÉRIFIÉE ET RESPECTÉE' : 'aucune contrainte'
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
