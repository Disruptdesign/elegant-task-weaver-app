
import { addMinutes, addDays, format } from 'date-fns';
import { Task, Event } from '../../types/task';
import { SchedulingOptions, SchedulingContext } from '../../types/scheduling';
import { TaskConstraintResolver } from './TaskConstraintResolver';
import { DependencyResolver } from './DependencyResolver';
import { TaskScheduler } from './TaskScheduler';
import { mergeSchedulingOptions } from './SchedulingOptions';

export class AlgorithmicScheduler {
  private events: Event[];
  private options: SchedulingOptions;
  private projects: any[];
  private constraintResolver: TaskConstraintResolver;
  private dependencyResolver: DependencyResolver;
  private taskScheduler: TaskScheduler;

  constructor(events: Event[], options: Partial<SchedulingOptions> = {}, projects: any[] = []) {
    this.events = events;
    this.options = mergeSchedulingOptions(options);
    this.projects = projects;
    this.constraintResolver = new TaskConstraintResolver(projects);
    this.dependencyResolver = new DependencyResolver(this.constraintResolver);
    this.taskScheduler = new TaskScheduler(events, this.options, projects);
  }

  /**
   * CORRECTION DÉFINITIVE: Programme toutes les tâches en PRÉSERVANT ABSOLUMENT les contraintes canStartFrom
   */
  scheduleTasks(tasks: Task[], isRescheduling: boolean = false): Task[] {
    console.log(`🚀 ${isRescheduling ? 'REPLANIFICATION' : 'PLANIFICATION INITIALE'} de ${tasks.length} tâches avec PRÉSERVATION canStartFrom`);
    
    // Séparer les tâches terminées, en cours et à programmer
    const context = this.categorizeTasks(tasks);
    
    console.log('📊 Répartition des tâches:', {
      terminées: context.completedTasks.length,
      enCours: context.tasksInProgress.length,
      àProgrammer: tasks.length - context.completedTasks.length - context.tasksInProgress.length
    });

    const tasksToSchedule = tasks.filter(task => 
      !task.completed && !this.constraintResolver.isTaskInProgress(task)
    );

    // CORRECTION CRITIQUE: Préserver les contraintes canStartFrom lors de la replanification
    const tasksWithProjectConstraints = tasksToSchedule.map(task => {
      const updatedTask = this.constraintResolver.applyProjectConstraints(task, isRescheduling);
      
      // RÈGLE ABSOLUE: Si la tâche originale avait un canStartFrom, le PRÉSERVER
      if (isRescheduling && task.canStartFrom) {
        console.log('🔒 PRÉSERVATION canStartFrom pour', task.title, ':', format(task.canStartFrom, 'dd/MM HH:mm'));
        return {
          ...updatedTask,
          canStartFrom: task.canStartFrom // PRÉSERVER la contrainte originale
        };
      }
      
      return updatedTask;
    });

    // Résoudre les dépendances
    const orderedTasks = this.dependencyResolver.resolveDependencies(tasksWithProjectConstraints);
    
    // Prioriser les tâches
    const prioritizedTasks = this.dependencyResolver.prioritizeTasks(orderedTasks);
    
    console.log('🎯 Ordre de planification final (canStartFrom PRÉSERVÉ):');
    prioritizedTasks.forEach((task, index) => {
      const constraintInfo = task.canStartFrom ? 
        `canStartFrom PRÉSERVÉ: ${format(task.canStartFrom, 'dd/MM HH:mm')}` : 
        'aucune contrainte temporelle';
      console.log(`   ${index + 1}. ${task.title} (${constraintInfo})`);
    });

    // Programmer les tâches une par une
    const scheduledTasks = this.scheduleTasksSequentially(prioritizedTasks, context);

    // Retourner toutes les tâches (terminées + en cours + nouvellement programmées)
    const allTasks = [...context.completedTasks, ...context.tasksInProgress, ...scheduledTasks];
    
    console.log(`✅ ${isRescheduling ? 'REPLANIFICATION' : 'PLANIFICATION'} terminée avec canStartFrom PRÉSERVÉ:`, {
      total: allTasks.length,
      programmées: scheduledTasks.filter(t => t.scheduledStart).length,
      nonProgrammées: scheduledTasks.filter(t => !t.scheduledStart).length,
      avecCanStartFrom: scheduledTasks.filter(t => t.canStartFrom).length
    });

    return allTasks;
  }

  private categorizeTask(tasks: Task[]): SchedulingContext {
    const completedTasks = tasks.filter(task => task.completed);
    const tasksInProgress = tasks.filter(task => this.constraintResolver.isTaskInProgress(task));
    
    return {
      completedTasks,
      tasksInProgress,
      scheduledTasks: [],
      events: this.events,
      projects: this.projects
    };
  }

  private scheduleTasksSequentially(tasks: Task[], context: SchedulingContext): Task[] {
    const scheduledTasks: Task[] = [];
    const now = new Date();
    const maxSearchDate = addDays(now, 365); // Chercher jusqu'à 1 an dans le futur

    for (const task of tasks) {
      console.log(`\n🔍 Programmation de: ${task.title}`);
      
      // Calculer la date de début la plus tôt possible en respectant ABSOLUMENT les contraintes
      const earliestStart = this.constraintResolver.calculateEarliestStart(
        task, 
        context.completedTasks, 
        scheduledTasks
      );
      
      // Essayer de programmer la tâche
      const scheduledTask = this.taskScheduler.scheduleTask(
        task, 
        earliestStart, 
        maxSearchDate, 
        [...scheduledTasks, ...context.tasksInProgress]
      );
      
      if (scheduledTask) {
        // CORRECTION CRITIQUE: PRÉSERVER canStartFrom même après programmation réussie
        const finalTask = this.preserveConstraints(scheduledTask, task);
        scheduledTasks.push(finalTask);
        
        console.log('✅ Tâche programmée avec canStartFrom PRÉSERVÉ:', format(scheduledTask.scheduledStart!, 'dd/MM HH:mm'));
      } else {
        console.log('❌ Impossible de programmer la tâche dans les contraintes de temps');
        // CORRECTION: Garder la tâche avec sa contrainte canStartFrom
        scheduledTasks.push({
          ...task,
          canStartFrom: task.canStartFrom // PRÉSERVER même si non programmée
        });
      }
    }

    return scheduledTasks;
  }

  private preserveConstraints(scheduledTask: Task, originalTask: Task): Task {
    const finalTask = {
      ...scheduledTask,
      canStartFrom: originalTask.canStartFrom // PRÉSERVER la contrainte originale
    };
    
    // VÉRIFICATION FINALE CRITIQUE avant ajout
    if (finalTask.canStartFrom && finalTask.scheduledStart && 
        new Date(finalTask.scheduledStart) < finalTask.canStartFrom) {
      console.log('🚨 ERREUR FINALE DÉTECTÉE: Violation de contrainte après programmation');
      console.log('   Correction forcée à la contrainte minimale');
      
      const correctedStart = finalTask.canStartFrom;
      const correctedEnd = addMinutes(correctedStart, finalTask.estimatedDuration);
      
      return {
        ...finalTask,
        scheduledStart: correctedStart,
        scheduledEnd: correctedEnd
        // canStartFrom PRÉSERVÉ (pas supprimé)
      };
    }
    
    return finalTask;
  }

  static rescheduleAll(tasks: Task[], events: Event[], options?: Partial<SchedulingOptions>, projects: any[] = []): Task[] {
    console.log('🔄 Replanification complète des tâches avec protection des tâches en cours et contraintes projet BIDIRECTIONNELLES');
    const scheduler = new AlgorithmicScheduler(events, options, projects);
    
    // Utiliser le mode replanification pour respecter les contraintes
    return scheduler.scheduleTasks(tasks, true);
  }
}
