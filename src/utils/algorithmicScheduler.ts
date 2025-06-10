import { Task, Event } from '../types/task';
import { addMinutes, startOfDay, endOfDay, isAfter, isBefore, isWithinInterval, addDays, format } from 'date-fns';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  event?: Event;
}

interface SchedulingOptions {
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  bufferBetweenTasks: number; // minutes
  maxTasksPerDay: number;
  allowWeekends: boolean;
}

const DEFAULT_OPTIONS: SchedulingOptions = {
  workingHours: {
    start: "09:00",
    end: "18:00"
  },
  bufferBetweenTasks: 15,
  maxTasksPerDay: 8,
  allowWeekends: false
};

export class AlgorithmicScheduler {
  private events: Event[];
  private options: SchedulingOptions;
  private projects: any[]; // Will be passed from the calling context

  constructor(events: Event[], options: Partial<SchedulingOptions> = {}, projects: any[] = []) {
    this.events = events;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.projects = projects;
  }

  /**
   * Vérifie si une tâche est actuellement en cours d'exécution
   */
  private isTaskInProgress(task: Task): boolean {
    if (!task.scheduledStart || task.completed) {
      return false;
    }
    
    const now = new Date();
    const taskStart = new Date(task.scheduledStart);
    const taskEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : addMinutes(taskStart, task.estimatedDuration);
    
    // Une tâche est en cours si elle a commencé mais n'est pas finie
    const inProgress = taskStart <= now && taskEnd > now;
    
    if (inProgress) {
      console.log('🔒 Tâche en cours détectée (PROTÉGÉE):', task.title, 
        'démarrée à', format(taskStart, 'dd/MM HH:mm'),
        'fin prévue à', format(taskEnd, 'HH:mm'));
    }
    
    return inProgress;
  }

  /**
   * CORRECTION MAJEURE: Vérifie si une tâche est en retard UNIQUEMENT basé sur sa deadline
   * La date canStartFrom ne doit JAMAIS influencer le statut "en retard"
   */
  private isTaskOverdue(task: Task): boolean {
    if (task.completed || !task.deadline) return false;
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    const isOverdue = deadline < now;
    
    if (isOverdue) {
      console.log('⏰ Tâche en retard détectée (DEADLINE DÉPASSÉE):', task.title, 'deadline était', format(deadline, 'dd/MM HH:mm'));
    } else {
      // Debug pour les tâches qui ne sont PAS en retard
      console.log('✅ Tâche dans les temps:', task.title, 'deadline', format(deadline, 'dd/MM HH:mm'));
      if (task.canStartFrom) {
        console.log('   canStartFrom:', format(task.canStartFrom, 'dd/MM HH:mm'), '(ne détermine PAS le statut en retard)');
      }
    }
    
    return isOverdue;
  }

  /**
   * CORRECTION CRITIQUE POUR REPLANIFICATION: Application ABSOLUE des contraintes de projet
   * La contrainte canStartFrom est maintenant STRICTE et INVIOLABLE même lors de la replanification
   */
  private applyProjectConstraints(task: Task, preserveExistingCanStartFrom: boolean = true): Task {
    if (!task.projectId) {
      return task;
    }

    const project = this.projects.find(p => p.id === task.projectId);
    if (!project) {
      console.warn('⚠️ Projet introuvable pour la tâche:', task.title, 'projectId:', task.projectId);
      return task;
    }

    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.deadline);
    const taskDeadline = new Date(task.deadline);
    const now = new Date();

    console.log('🎯 APPLICATION STRICTE des contraintes projet pour:', task.title);
    console.log('   Projet:', project.title, format(projectStart, 'dd/MM'), '-', format(projectEnd, 'dd/MM'));
    console.log('   Tâche deadline originale:', format(taskDeadline, 'dd/MM'));
    console.log('   Mode préservation canStartFrom:', preserveExistingCanStartFrom);
    
    let updatedTask = { ...task };

    // CONTRAINTE 1: Ajuster la deadline si nécessaire
    if (taskDeadline > projectEnd) {
      updatedTask.deadline = projectEnd;
      console.log('📅 Deadline tâche ajustée à la fin du projet:', format(projectEnd, 'dd/MM'));
    }

    if (new Date(updatedTask.deadline) < projectStart) {
      updatedTask.deadline = projectStart;
      console.log('📅 Deadline tâche ajustée au début du projet:', format(projectStart, 'dd/MM'));
    }

    // CONTRAINTE 2 CRITIQUE POUR REPLANIFICATION: Calcul de la date de début ABSOLUE
    // PRÉSERVER ABSOLUMENT la contrainte canStartFrom existante lors de la replanification
    const existingCanStartFrom = task.canStartFrom?.getTime() || 0;
    const projectStartTime = projectStart.getTime();
    const nowTime = now.getTime();
    
    console.log('🔍 ANALYSE des contraintes pour replanification:');
    console.log('   - Contrainte existante (canStartFrom):', existingCanStartFrom ? format(new Date(existingCanStartFrom), 'dd/MM HH:mm') : 'aucune');
    console.log('   - Contrainte projet (début):', format(projectStart, 'dd/MM HH:mm'));
    console.log('   - Contrainte temps (maintenant):', format(now, 'dd/MM HH:mm'));

    // RÈGLE ABSOLUE POUR REPLANIFICATION: 
    // Si preserveExistingCanStartFrom est true, la contrainte existante est INVIOLABLE
    // Sinon, prendre la plus restrictive (la plus tardive)
    let absoluteEarliestStart: number;
    
    if (preserveExistingCanStartFrom && existingCanStartFrom > 0) {
      // PRIORITÉ ABSOLUE à la contrainte existante lors de la replanification
      absoluteEarliestStart = Math.max(existingCanStartFrom, nowTime);
      console.log('🚨 MODE REPLANIFICATION: Contrainte existante PRÉSERVÉE');
    } else {
      // Mode normal: prendre la plus restrictive
      absoluteEarliestStart = Math.max(existingCanStartFrom, projectStartTime, nowTime);
      console.log('🔧 MODE NORMAL: Contrainte la plus restrictive appliquée');
    }
    
    updatedTask.canStartFrom = new Date(absoluteEarliestStart);

    console.log('🔒 CONTRAINTE FINALE ABSOLUE CALCULÉE (INVIOLABLE):');
    console.log('   - 🎯 RÉSULTAT FINAL INVIOLABLE:', format(updatedTask.canStartFrom, 'dd/MM HH:mm'));
    console.log('   ⚠️ AUCUNE TÂCHE NE PEUT ÊTRE PROGRAMMÉE AVANT CETTE DATE');

    return updatedTask;
  }

  /**
   * Résout les dépendances des tâches et retourne un ordre de planification valide
   */
  private resolveDependencies(tasks: Task[]): Task[] {
    console.log('🔗 Résolution des dépendances pour', tasks.length, 'tâches');
    
    const resolved: Task[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (task: Task): boolean => {
      if (visiting.has(task.id)) {
        console.warn('⚠️ Dépendance circulaire détectée pour la tâche:', task.title);
        return false;
      }
      
      if (visited.has(task.id)) {
        return true;
      }
      
      visiting.add(task.id);
      
      // Traiter les dépendances d'abord
      if (task.dependencies && task.dependencies.length > 0) {
        console.log('📋 Tâche', task.title, 'dépend de', task.dependencies.length, 'autre(s) tâche(s)');
        
        for (const depId of task.dependencies) {
          const dependency = tasks.find(t => t.id === depId);
          if (dependency) {
            console.log('   ➡️ Dépendance:', dependency.title);
            if (!visit(dependency)) {
              console.error('❌ Impossible de résoudre la dépendance:', dependency.title);
              visiting.delete(task.id);
              return false;
            }
          } else {
            console.warn('⚠️ Dépendance introuvable:', depId, 'pour la tâche:', task.title);
          }
        }
      }
      
      visiting.delete(task.id);
      visited.add(task.id);
      resolved.push(task);
      
      return true;
    };
    
    // Visiter toutes les tâches
    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task);
      }
    }
    
    console.log('✅ Ordre de résolution des dépendances:');
    resolved.forEach((task, index) => {
      const deps = task.dependencies?.length || 0;
      const isOverdue = this.isTaskOverdue(task);
      const overdueMsg = isOverdue ? ' (EN RETARD - priorité conservée)' : '';
      console.log(`   ${index + 1}. ${task.title} ${deps > 0 ? `(dépend de ${deps} tâche(s))` : '(aucune dépendance)'}${overdueMsg}`);
    });
    
    return resolved;
  }

  /**
   * CORRECTION ABSOLUE POUR REPLANIFICATION: La contrainte canStartFrom ne peut JAMAIS être violée
   */
  private calculateEarliestStart(task: Task, completedTasks: Task[], scheduledTasks: Task[]): Date {
    const now = new Date();
    
    // RÈGLE ABSOLUE: canStartFrom est PRIORITAIRE sur TOUT
    let absoluteEarliestStart = task.canStartFrom || now;
    
    // JAMAIS avant maintenant ET JAMAIS avant canStartFrom
    absoluteEarliestStart = new Date(Math.max(absoluteEarliestStart.getTime(), now.getTime()));
    
    if (task.canStartFrom) {
      console.log('🔒 CONTRAINTE ABSOLUE POUR REPLANIFICATION pour', task.title, ':', format(task.canStartFrom, 'dd/MM HH:mm'));
      console.log('   Date de début MINIMALE ABSOLUE:', format(absoluteEarliestStart, 'dd/MM HH:mm'));
      
      // VÉRIFICATION CRITIQUE: S'assurer que la contrainte est respectée
      if (absoluteEarliestStart < task.canStartFrom) {
        console.log('🚨 CORRECTION IMMÉDIATE: Violation de contrainte détectée lors du calcul');
        absoluteEarliestStart = task.canStartFrom;
      }
    }
    
    // CONTRAINTE 2: Vérifier les dépendances - MAIS JAMAIS avant la contrainte absolue
    if (task.dependencies && task.dependencies.length > 0) {
      console.log('🔗 Vérification des dépendances pour', task.title);
      
      for (const depId of task.dependencies) {
        // Chercher dans les tâches terminées
        const completedDep = completedTasks.find(t => t.id === depId && t.completed);
        if (completedDep) {
          console.log('   ✅ Dépendance terminée:', completedDep.title);
          continue;
        }
        
        // Chercher dans les tâches programmées
        const scheduledDep = scheduledTasks.find(t => t.id === depId && t.scheduledEnd);
        if (scheduledDep && scheduledDep.scheduledEnd) {
          const depEnd = new Date(scheduledDep.scheduledEnd);
          const depEndWithBuffer = addMinutes(depEnd, this.options.bufferBetweenTasks);
          
          // RÈGLE CRITIQUE: La contrainte absolue canStartFrom ne peut JAMAIS être violée
          const candidateStart = Math.max(depEndWithBuffer.getTime(), absoluteEarliestStart.getTime());
          
          if (candidateStart > absoluteEarliestStart.getTime()) {
            absoluteEarliestStart = new Date(candidateStart);
            console.log('   ⏰ Dépendance appliquée mais contrainte canStartFrom RESPECTÉE:', format(absoluteEarliestStart, 'dd/MM HH:mm'));
          }
        }
      }
    }
    
    // VÉRIFICATION FINALE CRITIQUE
    if (task.canStartFrom && absoluteEarliestStart < task.canStartFrom) {
      console.log('🚨 ERREUR FINALE DÉTECTÉE: Correction forcée de la contrainte');
      absoluteEarliestStart = task.canStartFrom;
    }
    
    console.log('🎯 Date de début FINALE ABSOLUE pour', task.title, ':', format(absoluteEarliestStart, 'dd/MM HH:mm'));
    return absoluteEarliestStart;
  }

  /**
   * CORRECTION CRITIQUE: Vérification ABSOLUE de la contrainte canStartFrom avant programmation
   */
  private scheduleTask(task: Task, startDate: Date, endDate: Date, existingTasks: Task[]): Task | null {
    console.log('🔍 Recherche de créneau pour:', task.title, '(durée:', task.estimatedDuration, 'min)');
    
    // VÉRIFICATION PRÉLIMINAIRE CRITIQUE
    if (task.canStartFrom) {
      console.log('🚨 CONTRAINTE CRITIQUE DÉTECTÉE "peut commencer à partir de":', format(task.canStartFrom, 'dd/MM HH:mm'));
    }
    
    const now = new Date();
    
    // RÈGLE ABSOLUE: La contrainte canStartFrom ne peut JAMAIS être violée
    let effectiveStartTime = Math.max(startDate.getTime(), now.getTime());
    
    // CONTRAINTE INVIOLABLE: Si canStartFrom est défini, il est ABSOLUMENT PRIORITAIRE
    if (task.canStartFrom) {
      effectiveStartTime = Math.max(effectiveStartTime, task.canStartFrom.getTime());
      console.log('🔒 CONTRAINTE ABSOLUE APPLIQUÉE:', format(new Date(effectiveStartTime), 'dd/MM HH:mm'));
      
      // VÉRIFICATION CRITIQUE: Ne JAMAIS programmer avant cette date
      if (effectiveStartTime < task.canStartFrom.getTime()) {
        console.log('🚨 ERREUR CRITIQUE: Tentative de violation de canStartFrom - ARRÊT');
        return null;
      }
    }
    
    let currentDate = new Date(effectiveStartTime);
    
    console.log('⏰ Recherche de créneau à partir de (CONTRAINTE ABSOLUE RESPECTÉE):', format(currentDate, 'dd/MM HH:mm'));
    
    // Chercher jour par jour
    const searchEndDate = this.isTaskOverdue(task) ? endDate : task.deadline;
    
    while (currentDate <= endDate && currentDate <= searchEndDate) {
      // Vérifier si c'est un jour de travail
      if (!this.isWorkingDay(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Obtenir les créneaux disponibles pour ce jour
      const availableSlots = this.getAvailableSlots(currentDate, existingTasks);
      
      // Chercher un créneau assez long
      for (const slot of availableSlots) {
        // CORRECTION ABSOLUE: Le créneau DOIT respecter la contrainte ABSOLUE
        const adjustedSlotStart = new Date(Math.max(slot.start.getTime(), effectiveStartTime));
        
        // VÉRIFICATION CRITIQUE SUPPLÉMENTAIRE
        if (task.canStartFrom && adjustedSlotStart < task.canStartFrom) {
          console.log('🚨 REJET: Créneau avant contrainte canStartFrom');
          continue;
        }
        
        if (adjustedSlotStart >= slot.end) {
          continue; // Le créneau est entièrement avant notre contrainte
        }
        
        const availableSlotEnd = slot.end;
        const slotDuration = (availableSlotEnd.getTime() - adjustedSlotStart.getTime()) / (1000 * 60);
        
        if (slotDuration >= task.estimatedDuration) {
          // Créneau trouvé !
          const scheduledStart = adjustedSlotStart;
          const scheduledEnd = addMinutes(scheduledStart, task.estimatedDuration);
          
          // VÉRIFICATION FINALE CRITIQUE: Triple vérification de la contrainte
          if (task.canStartFrom && scheduledStart < task.canStartFrom) {
            console.log('🚨 ERREUR FINALE: Tentative de programmer avant canStartFrom - REJET ABSOLU');
            continue;
          }
          
          // VÉRIFICATION : S'assurer qu'il n'y a pas de conflit avec les événements
          const testTask: Task = {
            ...task,
            scheduledStart,
            scheduledEnd
          };
          
          if (this.checkEventConflict(testTask, this.events)) {
            console.log('🚫 Créneau trouvé mais en conflit avec un événement, passage au suivant');
            continue;
          }
          
          console.log('✅ Créneau validé (CONTRAINTE ABSOLUE RESPECTÉE):', format(scheduledStart, 'dd/MM HH:mm'), '-', format(scheduledEnd, 'HH:mm'));
          
          // VÉRIFICATION FINALE AVANT RETOUR
          if (task.canStartFrom && scheduledStart < task.canStartFrom) {
            console.log('🚨 DERNIÈRE VÉRIFICATION ÉCHOUÉE - REJET');
            continue;
          }
          
          return {
            ...task,
            scheduledStart,
            scheduledEnd,
            canStartFrom: undefined // Nettoyer la contrainte une fois la tâche programmée
          };
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    console.log('❌ Aucun créneau valide trouvé pour:', task.title, '(contrainte canStartFrom ABSOLUMENT respectée)');
    return null;
  }

  private findConflictingEvent(task: Task, events: Event[]): Event | null {
    if (!task.scheduledStart || !task.scheduledEnd) return null;
    
    const taskStart = new Date(task.scheduledStart);
    const taskEnd = new Date(task.scheduledEnd);
    
    for (const event of events) {
      if (event.allDay) continue; // Ignorer les événements toute la journée
      
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Vérifier le chevauchement : deux créneaux se chevauchent si l'un commence avant que l'autre se termine
      const hasOverlap = taskStart < eventEnd && taskEnd > eventStart;
      
      if (hasOverlap) {
        console.log('🚫 Conflit détecté entre tâche', task.title, 'et événement', event.title);
        console.log('   Tâche:', format(taskStart, 'dd/MM HH:mm'), '-', format(taskEnd, 'HH:mm'));
        console.log('   Événement:', format(eventStart, 'dd/MM HH:mm'), '-', format(eventEnd, 'HH:mm'));
        return event;
      }
    }
    
    return null;
  }

  private checkEventConflict(task: Task, events: Event[]): boolean {
    return this.findConflictingEvent(task, events) !== null;
  }

  private prioritizeTasks(tasks: Task[]): Task[] {
    const priorityWeight = {
      'urgent': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return tasks.sort((a, b) => {
      // D'abord par priorité (les tâches en retard conservent leur priorité originale)
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Ensuite par deadline (plus proche = plus prioritaire)
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }

  private getAvailableSlots(date: Date, existingTasks: Task[]): TimeSlot[] {
    const dayStart = this.getWorkingDayStart(date);
    const dayEnd = this.getWorkingDayEnd(date);
    
    // Collecter tous les éléments occupés (événements + tâches programmées NON TERMINÉES)
    const occupiedSlots: TimeSlot[] = [];
    
    // Ajouter les événements
    this.events.forEach(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      if (this.isDateInRange(eventStart, date) || this.isDateInRange(eventEnd, date)) {
        occupiedSlots.push({
          start: eventStart,
          end: eventEnd,
          available: false,
          event
        });
      }
    });
    
    // Ajouter SEULEMENT les tâches NON TERMINÉES déjà programmées
    existingTasks.forEach(task => {
      // 🎯 MODIFICATION CLÉ : Ignorer les tâches terminées lors du calcul des créneaux occupés
      if (task.completed) {
        console.log('✅ Tâche terminée ignorée pour le calcul des créneaux:', task.title);
        return;
      }
      
      if (task.scheduledStart && task.scheduledEnd) {
        const taskStart = new Date(task.scheduledStart);
        const taskEnd = new Date(task.scheduledEnd);
        
        if (this.isDateInRange(taskStart, date)) {
          occupiedSlots.push({
            start: taskStart,
            end: taskEnd,
            available: false
          });
        }
      }
    });

    // Trier par heure de début
    occupiedSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Calculer les créneaux libres
    const availableSlots: TimeSlot[] = [];
    let currentTime = dayStart;
    
    for (const occupied of occupiedSlots) {
      // S'il y a un gap avant cet élément occupé
      if (currentTime < occupied.start) {
        availableSlots.push({
          start: currentTime,
          end: occupied.start,
          available: true
        });
      }
      
      // Avancer après cet élément + buffer
      currentTime = addMinutes(occupied.end, this.options.bufferBetweenTasks);
    }
    
    // Ajouter le créneau final si il reste du temps
    if (currentTime < dayEnd) {
      availableSlots.push({
        start: currentTime,
        end: dayEnd,
        available: true
      });
    }
    
    return availableSlots.filter(slot => {
      const duration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
      return duration >= 30; // Minimum 30 minutes
    });
  }

  private isDateInRange(dateToCheck: Date, referenceDate: Date): boolean {
    const start = startOfDay(referenceDate);
    const end = endOfDay(referenceDate);
    return isWithinInterval(dateToCheck, { start, end });
  }

  private isWorkingDay(date: Date): boolean {
    if (this.options.allowWeekends) return true;
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Lundi à vendredi
  }

  private getWorkingDayStart(date: Date): Date {
    const [hours, minutes] = this.options.workingHours.start.split(':').map(Number);
    const start = startOfDay(date);
    start.setHours(hours, minutes, 0, 0);
    return start;
  }

  private getWorkingDayEnd(date: Date): Date {
    const [hours, minutes] = this.options.workingHours.end.split(':').map(Number);
    const end = startOfDay(date);
    end.setHours(hours, minutes, 0, 0);
    return end;
  }

  static rescheduleAll(tasks: Task[], events: Event[], options?: Partial<SchedulingOptions>, projects: any[] = []): Task[] {
    console.log('🔄 Replanification complète des tâches avec protection des tâches en cours et contraintes projet');
    const scheduler = new AlgorithmicScheduler(events, options, projects);
    
    // Utiliser le mode replanification pour respecter les contraintes
    return scheduler.scheduleTasks(tasks, true);
  }
}

/**
 * Fonction utilitaire pour programmer automatiquement les tâches
 */
export function scheduleTasksAutomatically(
  tasks: Task[], 
  events: Event[], 
  options?: Partial<SchedulingOptions>,
  projects: any[] = []
): Task[] {
  const scheduler = new AlgorithmicScheduler(events, options, projects);
  return scheduler.scheduleTasks(tasks, false);
}

/**
 * CORRECTION CRITIQUE: Fonction pour replanifier après changement d'événements
 * avec préservation STRICTE des contraintes canStartFrom
 */
export function rescheduleAfterEventChange(
  tasks: Task[], 
  events: Event[], 
  options?: Partial<SchedulingOptions>,
  projects: any[] = []
): Task[] {
  console.log('🔄 REPLANIFICATION STRICTE avec préservation ABSOLUE des contraintes canStartFrom');
  return AlgorithmicScheduler.rescheduleAll(tasks, events, options, projects);
}
