
import { startOfDay, endOfDay, addMinutes, isWithinInterval } from 'date-fns';
import { TimeSlot, SchedulingOptions } from '../../types/scheduling';
import { Task, Event } from '../../types/task';

export class TimeSlotManager {
  private options: SchedulingOptions;

  constructor(options: SchedulingOptions) {
    this.options = options;
  }

  getAvailableSlots(date: Date, existingTasks: Task[], events: Event[]): TimeSlot[] {
    const dayStart = this.getWorkingDayStart(date);
    const dayEnd = this.getWorkingDayEnd(date);
    
    // Collecter tous les éléments occupés (événements + tâches programmées NON TERMINÉES)
    const occupiedSlots: TimeSlot[] = [];
    
    // Ajouter les événements
    events.forEach(event => {
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

  isWorkingDay(date: Date): boolean {
    if (this.options.allowWeekends) return true;
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Lundi à vendredi
  }

  getWorkingDayStart(date: Date): Date {
    const [hours, minutes] = this.options.workingHours.start.split(':').map(Number);
    const start = startOfDay(date);
    start.setHours(hours, minutes, 0, 0);
    return start;
  }

  getWorkingDayEnd(date: Date): Date {
    const [hours, minutes] = this.options.workingHours.end.split(':').map(Number);
    const end = startOfDay(date);
    end.setHours(hours, minutes, 0, 0);
    return end;
  }

  private isDateInRange(dateToCheck: Date, referenceDate: Date): boolean {
    const start = startOfDay(referenceDate);
    const end = endOfDay(referenceDate);
    return isWithinInterval(dateToCheck, { start, end });
  }
}
