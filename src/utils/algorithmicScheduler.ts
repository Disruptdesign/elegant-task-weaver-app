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

  constructor(events: Event[], options: Partial<SchedulingOptions> = {}) {
    this.events = events;
    this.options = { ...DEFAULT_OPTIONS, ...options };
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
      console.log(`   ${index + 1}. ${task.title} ${deps > 0 ? `(dépend de ${deps} tâche(s))` : '(aucune dépendance)'}`);
    });
    
    return resolved;
  }

  /**
   * Calcule la date de début la plus tôt possible pour une tâche en fonction de ses dépendances
   */
  private calculateEarliestStart(task: Task, completedTasks: Task[], scheduledTasks: Task[]): Date {
    const now = new Date();
    let earliestStart = now;
    
    // Appliquer la contrainte canStartFrom si définie
    if (task.canStartFrom && task.canStartFrom > earliestStart) {
      earliestStart = task.canStartFrom;
    }
    
    // Vérifier les dépendances
    if (task.dependencies && task.dependencies.length > 0) {
      console.log('🔗 Calcul de la date de début pour', task.title, 'avec', task.dependencies.length, 'dépendance(s)');
      
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
          
          if (depEndWithBuffer > earliestStart) {
            earliestStart = depEndWithBuffer;
            console.log('   ⏰ Dépendance programmée:', scheduledDep.title, 
              'se termine à', format(depEnd, 'dd/MM HH:mm'),
              'donc début au plus tôt à', format(earliestStart, 'dd/MM HH:mm'));
          }
        } else {
          console.warn('   ⚠️ Dépendance non programmée:', depId);
        }
      }
    }
    
    return earliestStart;
  }

  /**
   * Planifie automatiquement les tâches selon leur priorité, deadline et dépendances
   */
  scheduleTasks(tasks: Task[], isRescheduling: boolean = false): Task[] {
    console.log('🤖 Début de la planification algorithmique pour', tasks.length, 'tâches');
    
    const now = new Date();
    console.log('⏰ Heure actuelle de référence:', format(now, 'dd/MM/yyyy HH:mm:ss'));
    
    // Séparer les tâches selon leur statut avec protection des tâches en cours
    let protectedTasks: Task[] = [];
    let tasksToSchedule: Task[] = [];

    if (isRescheduling) {
      console.log('🔄 MODE REPLANIFICATION AGGRESSIVE avec protection des tâches en cours');
      
      // PROTECTION ABSOLUE : Figer les tâches terminées ET les tâches en cours
      protectedTasks = tasks.filter(task => task.completed || this.isTaskInProgress(task));
      
      // Séparer les tâches en cours pour un traitement spécial
      const completedTasks = protectedTasks.filter(task => task.completed);
      const tasksInProgress = protectedTasks.filter(task => this.isTaskInProgress(task));
      
      // TOUTES les autres tâches seront replanifiées
      const otherTasks = tasks.filter(task => !task.completed && !this.isTaskInProgress(task));
      
      tasksToSchedule = otherTasks.map(task => ({
        ...task,
        scheduledStart: undefined,
        scheduledEnd: undefined
      }));
      
      console.log('🔒 Tâches protégées (terminées):', completedTasks.length);
      console.log('🔒 Tâches protégées (EN COURS - INTOUCHABLES):', tasksInProgress.length);
      console.log('🔄 Tâches à replanifier:', tasksToSchedule.length);
      
      // Afficher les détails des tâches en cours protégées
      tasksInProgress.forEach(task => {
        const taskStart = new Date(task.scheduledStart!);
        const taskEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : addMinutes(taskStart, task.estimatedDuration);
        console.log(`   🔒 "${task.title}" : ${format(taskStart, 'dd/MM HH:mm')} - ${format(taskEnd, 'HH:mm')} (EN COURS)`);
      });
      
    } else {
      // Mode planification normale avec protection des tâches en cours
      tasksToSchedule = tasks.filter(task => !task.scheduledStart && !task.completed);
      
      // Vérifier les tâches déjà programmées pour les conflits ou problèmes
      const alreadyScheduled = tasks.filter(task => task.scheduledStart && !task.completed);
      const validScheduledTasks: Task[] = [];
      
      alreadyScheduled.forEach(task => {
        // PROTECTION ABSOLUE : Ne jamais toucher aux tâches en cours
        if (this.isTaskInProgress(task)) {
          console.log('🔒 Tâche en cours PROTÉGÉE (ne sera pas replanifiée):', task.title);
          validScheduledTasks.push(task);
          return;
        }
        
        const taskStart = new Date(task.scheduledStart!);
        
        // RÈGLE 1: Vérifier si la tâche est dans le passé (sauf si en cours)
        if (taskStart < now) {
          console.log('⏰ Tâche dépassée détectée:', task.title, 'était à', format(taskStart, 'dd/MM HH:mm'));
          tasksToSchedule.push({
            ...task,
            scheduledStart: undefined,
            scheduledEnd: undefined
          });
        } else {
          // RÈGLE 2: Vérifier les conflits avec les événements
          const conflictingEvent = this.findConflictingEvent(task, this.events);
          
          if (conflictingEvent) {
            console.log('⚠️ Tâche programmée en conflit avec un événement:', task.title);
            console.log('🔄 La tâche sera replanifiée après l\'événement:', conflictingEvent.title);
            
            // Ajouter la tâche à replanifier avec une contrainte pour commencer après l'événement
            const taskToReschedule = {
              ...task,
              scheduledStart: undefined,
              scheduledEnd: undefined,
              canStartFrom: addMinutes(new Date(conflictingEvent.endDate), this.options.bufferBetweenTasks)
            };
            
            tasksToSchedule.push(taskToReschedule);
          } else {
            validScheduledTasks.push(task);
          }
        }
      });
      
      // Ajouter les tâches déjà terminées
      protectedTasks = [...tasks.filter(task => task.completed), ...validScheduledTasks];
      
      console.log('📋 Tâches à programmer:', tasksToSchedule.length);
      console.log('✅ Tâches protégées (complétées/programmées sans conflit):', protectedTasks.length);
    }

    // Résoudre les dépendances et trier les tâches
    const resolvedTasks = this.resolveDependencies(tasksToSchedule);
    const sortedTasks = this.prioritizeTasks(resolvedTasks);
    
    // Programmer chaque tâche à partir de maintenant
    const newlyScheduledTasks: Task[] = [];
    const startDate = now; // Commencer à partir de maintenant
    const endDate = addDays(startDate, 30); // Planifier sur 30 jours

    console.log(`🎯 Planification de ${sortedTasks.length} tâche(s) par ordre de priorité et dépendances...`);

    for (const task of sortedTasks) {
      // Calculer la date de début la plus tôt possible en fonction des dépendances
      const earliestStart = this.calculateEarliestStart(task, protectedTasks, [...protectedTasks, ...newlyScheduledTasks]);
      
      const scheduledTask = this.scheduleTask(
        { ...task, canStartFrom: earliestStart }, 
        startDate, 
        endDate, 
        [...protectedTasks, ...newlyScheduledTasks]
      );
      
      if (scheduledTask) {
        newlyScheduledTasks.push(scheduledTask);
        console.log('✅ Tâche programmée:', task.title, 'à', format(scheduledTask.scheduledStart!, 'dd/MM HH:mm'));
      } else {
        console.log('❌ Impossible de programmer:', task.title);
        newlyScheduledTasks.push(task); // Garder la tâche même si non programmée
      }
    }

    const result = [...protectedTasks, ...newlyScheduledTasks];
    
    console.log('📊 Résumé de la planification avec dépendances:');
    console.log(`   - Tâches traitées: ${result.length}`);
    console.log(`   - Tâches programmées: ${result.filter(t => t.scheduledStart && !t.completed).length}`);
    console.log(`   - Tâches non programmées: ${result.filter(t => !t.scheduledStart && !t.completed).length}`);
    console.log(`   - Tâches terminées: ${result.filter(t => t.completed).length}`);
    console.log(`   - Tâches en cours (protégées): ${result.filter(t => this.isTaskInProgress(t)).length}`);
    console.log(`   - Tâches avec dépendances: ${result.filter(t => t.dependencies && t.dependencies.length > 0).length}`);

    return result;
  }

  /**
   * Trouve l'événement qui entre en conflit avec une tâche
   */
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

  /**
   * Vérifie si une tâche est en conflit avec des événements (version simplifiée pour validation)
   */
  private checkEventConflict(task: Task, events: Event[]): boolean {
    return this.findConflictingEvent(task, events) !== null;
  }

  /**
   * Trie les tâches par priorité et proximité de deadline
   */
  private prioritizeTasks(tasks: Task[]): Task[] {
    const priorityWeight = {
      'urgent': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return tasks.sort((a, b) => {
      // D'abord par priorité
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Ensuite par deadline (plus proche = plus prioritaire)
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }

  /**
   * Programme une tâche spécifique dans le premier créneau disponible
   */
  private scheduleTask(task: Task, startDate: Date, endDate: Date, existingTasks: Task[]): Task | null {
    console.log('🔍 Recherche de créneau pour:', task.title, '(durée:', task.estimatedDuration, 'min)');
    
    const now = new Date();
    
    // RÈGLE ABSOLUE : S'assurer que la tâche ne peut pas commencer avant maintenant
    // MAIS si la tâche a une contrainte canStartFrom (par ex. après un événement), respecter cette contrainte
    let earliestStart = Math.max(
      startDate.getTime(), 
      task.canStartFrom?.getTime() || startDate.getTime(),
      now.getTime() // ← Contrainte absolue : jamais avant maintenant
    );
    
    // Si canStartFrom est défini et est après maintenant, l'utiliser comme référence
    if (task.canStartFrom && task.canStartFrom.getTime() > now.getTime()) {
      earliestStart = task.canStartFrom.getTime();
      console.log('📅 Tâche contrainte à commencer après:', format(task.canStartFrom, 'dd/MM HH:mm'), '(probablement après un événement ou dépendance)');
    }
    
    let currentDate = new Date(earliestStart);
    
    console.log('⏰ Recherche à partir de:', format(currentDate, 'dd/MM HH:mm'));
    
    // Chercher jour par jour
    while (currentDate <= endDate && currentDate <= task.deadline) {
      // Vérifier si c'est un jour de travail
      if (!this.isWorkingDay(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Obtenir les créneaux disponibles pour ce jour
      const availableSlots = this.getAvailableSlots(currentDate, existingTasks);
      
      // Chercher un créneau assez long
      for (const slot of availableSlots) {
        // RÈGLE ABSOLUE : S'assurer que le créneau commence au plus tôt à l'heure de contrainte
        const adjustedSlotStart = new Date(Math.max(slot.start.getTime(), earliestStart));
        
        if (adjustedSlotStart >= slot.end) {
          continue; // Le créneau est entièrement avant notre contrainte
        }
        
        const availableSlotEnd = slot.end;
        const slotDuration = (availableSlotEnd.getTime() - adjustedSlotStart.getTime()) / (1000 * 60);
        
        if (slotDuration >= task.estimatedDuration) {
          // Créneau trouvé !
          const scheduledStart = adjustedSlotStart;
          const scheduledEnd = addMinutes(scheduledStart, task.estimatedDuration);
          
          // VÉRIFICATION FINALE : S'assurer qu'il n'y a pas de conflit avec les événements
          const testTask: Task = {
            ...task,
            scheduledStart,
            scheduledEnd
          };
          
          if (this.checkEventConflict(testTask, this.events)) {
            console.log('🚫 Créneau trouvé mais en conflit avec un événement, passage au suivant');
            continue;
          }
          
          console.log('✅ Créneau validé (sans conflit):', format(scheduledStart, 'dd/MM HH:mm'), '-', format(scheduledEnd, 'HH:mm'));
          
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

    console.log('❌ Aucun créneau valide trouvé pour:', task.title);
    return null;
  }

  /**
   * Obtient les créneaux disponibles pour un jour donné
   */
  private getAvailableSlots(date: Date, existingTasks: Task[]): TimeSlot[] {
    const dayStart = this.getWorkingDayStart(date);
    const dayEnd = this.getWorkingDayEnd(date);
    
    // Collecter tous les éléments occupés (événements + tâches programmées)
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
    
    // Ajouter les tâches déjà programmées
    existingTasks.forEach(task => {
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

  /**
   * Vérifie si une date tombe dans un jour donné
   */
  private isDateInRange(dateToCheck: Date, referenceDate: Date): boolean {
    const start = startOfDay(referenceDate);
    const end = endOfDay(referenceDate);
    return isWithinInterval(dateToCheck, { start, end });
  }

  /**
   * Vérifie si c'est un jour de travail
   */
  private isWorkingDay(date: Date): boolean {
    if (this.options.allowWeekends) return true;
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Lundi à vendredi
  }

  /**
   * Obtient l'heure de début de travail pour un jour
   */
  private getWorkingDayStart(date: Date): Date {
    const [hours, minutes] = this.options.workingHours.start.split(':').map(Number);
    const start = startOfDay(date);
    start.setHours(hours, minutes, 0, 0);
    return start;
  }

  /**
   * Obtient l'heure de fin de travail pour un jour
   */
  private getWorkingDayEnd(date: Date): Date {
    const [hours, minutes] = this.options.workingHours.end.split(':').map(Number);
    const end = startOfDay(date);
    end.setHours(hours, minutes, 0, 0);
    return end;
  }

  /**
   * Replanifie toutes les tâches (utile après ajout/suppression d'événement)
   */
  static rescheduleAll(tasks: Task[], events: Event[], options?: Partial<SchedulingOptions>): Task[] {
    console.log('🔄 Replanification complète des tâches avec protection des tâches en cours');
    const scheduler = new AlgorithmicScheduler(events, options);
    
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
  options?: Partial<SchedulingOptions>
): Task[] {
  const scheduler = new AlgorithmicScheduler(events, options);
  return scheduler.scheduleTasks(tasks, false);
}

/**
 * Fonction pour replanifier après changement d'événements
 */
export function rescheduleAfterEventChange(
  tasks: Task[], 
  events: Event[], 
  options?: Partial<SchedulingOptions>
): Task[] {
  return AlgorithmicScheduler.rescheduleAll(tasks, events, options);
}
