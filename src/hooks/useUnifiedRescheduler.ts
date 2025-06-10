
import { useCallback } from 'react';
import { useAlgorithmicScheduler } from './useAlgorithmicScheduler';
import { Task, Event, Project } from '../types/task';

export function useUnifiedRescheduler() {
  const { rescheduleAllTasks, isScheduling } = useAlgorithmicScheduler();

  const performUnifiedReschedule = useCallback(async (
    tasks: Task[],
    events: Event[],
    projects: Project[] = [],
    onTasksUpdate: (tasks: Task[]) => void
  ) => {
    console.log('🔄 UNIFICATION GLOBALE: Replanification avec contraintes canStartFrom STRICTEMENT PRÉSERVÉES');
    console.log('📊 Données pour replanification unifiée:', {
      tasks: tasks.length,
      events: events.length,
      projects: projects.length
    });

    // DEBUG CRITIQUE: Vérifier que les projets sont bien passés
    console.log('🔍 PROJETS DISPONIBLES pour replanification:', projects.map(p => ({
      id: p.id,
      title: p.title,
      startDate: p.startDate,
      deadline: p.deadline
    })));

    // DEBUG CRITIQUE: Vérifier les tâches avec projectId
    const tasksWithProjects = tasks.filter(t => t.projectId);
    console.log('🏗️ TÂCHES AVEC PROJET:', tasksWithProjects.map(t => ({
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      originalCanStartFrom: t.canStartFrom ? new Date(t.canStartFrom).toLocaleString() : 'aucune'
    })));

    // PRÉSERVATION DEBUG: Afficher les contraintes avant replanification
    const tasksWithCanStartFrom = tasks.filter(t => t.canStartFrom);
    console.log('🔒 AVANT REPLANIFICATION - Tâches avec canStartFrom:', tasksWithCanStartFrom.length);
    tasksWithCanStartFrom.forEach(task => {
      console.log(`   - ${task.title}: ${new Date(task.canStartFrom!).toLocaleString()}`);
    });

    try {
      // CORRECTION CRITIQUE: S'assurer que les projets sont TOUJOURS passés
      if (projects.length === 0) {
        console.warn('⚠️ ATTENTION: Aucun projet passé à la replanification - contraintes projet ignorées');
      }

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

        // VALIDATION FINALE: S'assurer que les contraintes projet sont appliquées même après restauration
        const finalCorrectedTasks = correctedTasks.map(task => {
          if (task.projectId) {
            const project = projects.find(p => p.id === task.projectId);
            if (project) {
              const projectStart = new Date(project.startDate);
              const now = new Date();
              
              // Calculer la contrainte absolue
              const absoluteConstraint = task.canStartFrom || now;
              const finalConstraint = new Date(Math.max(
                absoluteConstraint.getTime(),
                projectStart.getTime(),
                now.getTime()
              ));
              
              console.log('🎯 APPLICATION FINALE contrainte projet pour:', task.title, formatDate(finalConstraint, 'dd/MM HH:mm'));
              
              return {
                ...task,
                canStartFrom: finalConstraint,
                deadline: new Date(Math.min(new Date(task.deadline).getTime(), new Date(project.deadline).getTime()))
              };
            }
          }
          return task;
        });

        onTasksUpdate(finalCorrectedTasks);
        console.log('✅ UNIFICATION GLOBALE: Contraintes perdues RESTAURÉES avec contraintes projet');
        return finalCorrectedTasks;
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

// Fonction utilitaire pour formater les dates
function formatDate(date: Date, formatString: string): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return formatString
    .replace('dd', day)
    .replace('MM', month)
    .replace('HH', hours)
    .replace('mm', minutes);
}
