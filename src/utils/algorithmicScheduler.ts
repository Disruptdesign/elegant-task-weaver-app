
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
   * Planifie automatiquement les tâches selon leur priorité et deadline
   */
  scheduleTasks(tasks: Task[]): Task[] {
    console.log('🤖 Début de la planification algorithmique pour', tasks.length, 'tâches');
    
    // Filtrer les tâches non programmées et non complétées
    const unscheduledTasks = tasks.filter(task => !task.scheduledStart && !task.completed);
    const scheduledTasks = tasks.filter(task => task.scheduledStart || task.completed);
    
    console.log('📋 Tâches à programmer:', unscheduledTasks.length);
    console.log('✅ Tâches déjà programmées/complétées:', scheduledTasks.length);

    // Trier les tâches par priorité et deadline
    const sortedTasks = this.prioritizeTasks(unscheduledTasks);
    
    // Programmer chaque tâche
    const newlyScheduledTasks: Task[] = [];
    const startDate = new Date();
    const endDate = addDays(startDate, 30); // Planifier sur 30 jours

    for (const task of sortedTasks) {
      const scheduledTask = this.scheduleTask(task, startDate, endDate, [...scheduledTasks, ...newlyScheduledTasks]);
      if (scheduledTask) {
        newlyScheduledTasks.push(scheduledTask);
        console.log('✅ Tâche programmée:', task.title, 'à', format(scheduledTask.scheduledStart!, 'dd/MM HH:mm'));
      } else {
        console.log('❌ Impossible de programmer:', task.title);
        newlyScheduledTasks.push(task); // Garder la tâche même si non programmée
      }
    }

    return [...scheduledTasks, ...newlyScheduledTasks];
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
    
    let currentDate = new Date(Math.max(startDate.getTime(), task.canStartFrom?.getTime() || startDate.getTime()));
    
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
        const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
        
        if (slotDuration >= task.estimatedDuration) {
          // Créneau trouvé !
          const scheduledStart = slot.start;
          const scheduledEnd = addMinutes(scheduledStart, task.estimatedDuration);
          
          console.log('✅ Créneau trouvé:', format(scheduledStart, 'dd/MM HH:mm'), '-', format(scheduledEnd, 'HH:mm'));
          
          return {
            ...task,
            scheduledStart,
            scheduledEnd
          };
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    console.log('❌ Aucun créneau trouvé pour:', task.title);
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
    console.log('🔄 Replanification complète des tâches');
    const scheduler = new AlgorithmicScheduler(events, options);
    
    // Enlever la planification existante des tâches
    const unscheduledTasks = tasks.map(task => ({
      ...task,
      scheduledStart: undefined,
      scheduledEnd: undefined
    }));
    
    return scheduler.scheduleTasks(unscheduledTasks);
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
  return scheduler.scheduleTasks(tasks);
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
