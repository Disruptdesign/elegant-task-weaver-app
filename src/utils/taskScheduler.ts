
import { Task, Event, TimeSlot } from '../types/task';

export class TaskScheduler {
  private workingHours = {
    start: 9, // 9h
    end: 18,  // 18h
  };

  scheduleTask(task: Task, existingTasks: Task[] = [], events: Event[] = []): Task {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const canStartFrom = task.canStartFrom ? new Date(task.canStartFrom) : now;
    
    // Calculer la priorité numérique
    const priorityWeight = this.getPriorityWeight(task.priority);
    
    // Calculer l'urgence basée sur la deadline
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const daysUntilDeadline = timeUntilDeadline / (1000 * 60 * 60 * 24);
    
    // Score de planification (plus bas = plus prioritaire)
    const schedulingScore = daysUntilDeadline / priorityWeight;
    
    // Trouver le prochain créneau disponible en tenant compte de la date de début possible
    const startDate = new Date(Math.max(canStartFrom.getTime(), now.getTime()));
    const scheduledStart = this.findNextAvailableSlot(
      task.estimatedDuration + (task.bufferBefore || 0) + (task.bufferAfter || 0),
      existingTasks,
      events,
      startDate
    );
    
    const taskStart = new Date(scheduledStart.getTime() + (task.bufferBefore || 0) * 60000);
    const taskEnd = new Date(taskStart.getTime() + task.estimatedDuration * 60000);
    const scheduledEnd = new Date(taskEnd.getTime() + (task.bufferAfter || 0) * 60000);
    
    return {
      ...task,
      scheduledStart: taskStart,
      scheduledEnd: taskEnd,
    };
  }

  private getPriorityWeight(priority: Task['priority']): number {
    switch (priority) {
      case 'urgent': return 0.5;
      case 'high': return 1;
      case 'medium': return 2;
      case 'low': return 4;
      default: return 2;
    }
  }

  private findNextAvailableSlot(
    totalDuration: number, // Durée totale incluant les buffers
    existingTasks: Task[],
    events: Event[] = [],
    startFrom: Date = new Date()
  ): Date {
    const start = new Date(startFrom);
    
    // Commencer aux heures de travail si on est avant
    if (start.getHours() < this.workingHours.start) {
      start.setHours(this.workingHours.start, 0, 0, 0);
    }
    
    // Si on est déjà passé les heures de travail, commencer le lendemain
    if (start.getHours() >= this.workingHours.end) {
      start.setDate(start.getDate() + 1);
      start.setHours(this.workingHours.start, 0, 0, 0);
    }
    
    let currentSlot = new Date(start);
    
    while (true) {
      // Vérifier si on est dans les heures de travail
      if (currentSlot.getHours() >= this.workingHours.end) {
        currentSlot.setDate(currentSlot.getDate() + 1);
        currentSlot.setHours(this.workingHours.start, 0, 0, 0);
        continue;
      }
      
      // Vérifier si le week-end (samedi = 6, dimanche = 0)
      if (currentSlot.getDay() === 0 || currentSlot.getDay() === 6) {
        currentSlot.setDate(currentSlot.getDate() + (currentSlot.getDay() === 0 ? 1 : 2));
        currentSlot.setHours(this.workingHours.start, 0, 0, 0);
        continue;
      }
      
      // Calculer la fin du créneau
      const endSlot = new Date(currentSlot.getTime() + totalDuration * 60000);
      
      // Vérifier si le créneau dépasse les heures de travail
      if (endSlot.getHours() > this.workingHours.end || 
          (endSlot.getHours() === this.workingHours.end && endSlot.getMinutes() > 0)) {
        currentSlot.setDate(currentSlot.getDate() + 1);
        currentSlot.setHours(this.workingHours.start, 0, 0, 0);
        continue;
      }
      
      // Vérifier les conflits avec les événements (priorité aux événements)
      const hasEventConflict = events.some(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return (currentSlot < eventEnd && endSlot > eventStart);
      });
      
      if (hasEventConflict) {
        // Trouver le prochain créneau après tous les événements en conflit
        const conflictingEvents = events.filter(event => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          return (currentSlot < eventEnd && endSlot > eventStart);
        });
        
        const latestEventEnd = conflictingEvents.reduce((latest, event) => {
          const eventEnd = new Date(event.endDate);
          return eventEnd > latest ? eventEnd : latest;
        }, new Date(0));
        
        currentSlot = new Date(latestEventEnd);
        // Arrondir au prochain créneau de 30 minutes
        const minutes = currentSlot.getMinutes();
        if (minutes % 30 !== 0) {
          currentSlot.setMinutes(Math.ceil(minutes / 30) * 30, 0, 0);
        }
        continue;
      }
      
      // Vérifier les conflits avec les tâches existantes
      const hasTaskConflict = existingTasks.some(task => {
        if (!task.scheduledStart || !task.scheduledEnd) return false;
        const taskStart = new Date(task.scheduledStart);
        const taskEnd = new Date(task.scheduledEnd);
        
        // Inclure les buffers dans le calcul
        const taskStartWithBuffer = new Date(taskStart.getTime() - (task.bufferBefore || 0) * 60000);
        const taskEndWithBuffer = new Date(taskEnd.getTime() + (task.bufferAfter || 0) * 60000);
        
        return (currentSlot < taskEndWithBuffer && endSlot > taskStartWithBuffer);
      });
      
      if (!hasTaskConflict) {
        return currentSlot;
      }
      
      // Passer au créneau suivant (30 minutes)
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }
  }

  rescheduleAllTasks(tasks: Task[], events: Event[] = []): Task[] {
    const uncompletedTasks = tasks.filter(task => !task.completed);
    const scheduledTasks: Task[] = [];
    
    // Trier par priorité et deadline
    const sortedTasks = uncompletedTasks.sort((a, b) => {
      const aPriorityWeight = this.getPriorityWeight(a.priority);
      const bPriorityWeight = this.getPriorityWeight(b.priority);
      
      if (aPriorityWeight !== bPriorityWeight) {
        return aPriorityWeight - bPriorityWeight;
      }
      
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    
    // Planifier chaque tâche
    for (const task of sortedTasks) {
      const scheduledTask = this.scheduleTask(task, scheduledTasks, events);
      scheduledTasks.push(scheduledTask);
    }
    
    return tasks.map(task => {
      const scheduled = scheduledTasks.find(st => st.id === task.id);
      return scheduled || task;
    });
  }
}

export const taskScheduler = new TaskScheduler();
