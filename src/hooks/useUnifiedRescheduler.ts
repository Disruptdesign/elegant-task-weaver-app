
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

    // PRÉSERVATION DEBUG: Afficher les contraintes avant replanification
    const tasksWithCanStartFrom = tasks.filter(t => t.canStartFrom);
    console.log('🔒 AVANT REPLANIFICATION - Tâches avec canStartFrom:', tasksWithCanStartFrom.length);
    tasksWithCanStartFrom.forEach(task => {
      console.log(`   - ${task.title}: ${new Date(task.canStartFrom!).toLocaleString()}`);
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
      
      // VÉRIFICATION FINALE: S'assurer qu'aucune contrainte canStartFrom n'a disparu
      const finalTasksWithCanStartFrom = rescheduledTasks.filter(t => t.canStartFrom);
      console.log('🔒 APRÈS REPLANIFICATION - Tâches avec canStartFrom:', finalTasksWithCanStartFrom.length);
      finalTasksWithCanStartFrom.forEach(task => {
        console.log(`   - ${task.title}: ${new Date(task.canStartFrom!).toLocaleString()}`);
      });

      // VÉRIFICATION CRITIQUE: Detecter les pertes de contraintes
      const lostConstraints = tasksWithCanStartFrom.filter(originalTask => {
        const rescheduledTask = rescheduledTasks.find(t => t.id === originalTask.id);
        return rescheduledTask && !rescheduledTask.canStartFrom;
      });

      if (lostConstraints.length > 0) {
        console.error('🚨 CONTRAINTES PERDUES DÉTECTÉES:', lostConstraints.map(t => t.title));
        
        // RESTAURER LES CONTRAINTES PERDUES
        const correctedTasks = rescheduledTasks.map(task => {
          const originalTask = tasks.find(t => t.id === task.id);
          if (originalTask && originalTask.canStartFrom && !task.canStartFrom) {
            console.log('🔧 RESTAURATION contrainte pour:', task.title);
            return {
              ...task,
              canStartFrom: originalTask.canStartFrom
            };
          }
          return task;
        });

        onTasksUpdate(correctedTasks);
        console.log('✅ UNIFICATION GLOBALE: Contraintes perdues RESTAURÉES');
        return correctedTasks;
      }
      
      onTasksUpdate(rescheduledTasks);
      console.log('✅ UNIFICATION GLOBALE: Replanification terminée avec contraintes STRICTEMENT respectées');
      
      return rescheduledTasks;
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
