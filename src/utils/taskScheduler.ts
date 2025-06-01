
import { Task, TimeSlot } from '../types/task';

export class TaskScheduler {
  private workingHours = {
    start: 9, // 9h
    end: 18,  // 18h
  };

  scheduleTask(task: Task, existingTasks: Task[] = []): Task {
    const now = new Date();
    const deadline = new Date(task.deadline);
    
    // Calculer la priorité numérique
    const priorityWeight = this.getPriorityWeight(task.priority);
    
    // Calculer l'urgence basée sur la deadline
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const daysUntilDeadline = timeUntilDeadline / (1000 * 60 * 60 * 24);
    
    // Score de planification (plus bas = plus prioritaire)
    const schedulingScore = daysUntilDeadline / priorityWeight;
    
    // Trouver le prochain créneau disponible
    const scheduledStart = this.findNextAvailableSlot(
      task.estimatedDuration,
      existingTasks,
      now
    );
    
    const scheduledEnd = new Date(scheduledStart.getTime() + task.estimatedDuration * 60000);
    
    return {
      ...task,
      scheduledStart,
      scheduledEnd,
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
    duration: number,
    existingTasks: Task[],
    startFrom: Date = new Date()
  ): Date {
    const start = new Date(startFrom);
    start.setHours(this.workingHours.start, 0, 0, 0);
    
    // Si on est déjà passé les heures de travail, commencer le lendemain
    if (startFrom.getHours() >= this.workingHours.end) {
      start.setDate(start.getDate() + 1);
    }
    
    let currentSlot = new Date(start);
    
    while (true) {
      // Vérifier si on est dans les heures de travail
      if (currentSlot.getHours() >= this.workingHours.end) {
        currentSlot.setDate(currentSlot.getDate() + 1);
        currentSlot.setHours(this.workingHours.start, 0, 0, 0);
        continue;
      }
      
      // Vérifier les conflits avec les tâches existantes
      const endSlot = new Date(currentSlot.getTime() + duration * 60000);
      const hasConflict = existingTasks.some(task => {
        if (!task.scheduledStart || !task.scheduledEnd) return false;
        return (
          currentSlot < task.scheduledEnd && endSlot > task.scheduledStart
        );
      });
      
      if (!hasConflict && endSlot.getHours() <= this.workingHours.end) {
        return currentSlot;
      }
      
      // Passer au créneau suivant (30 minutes)
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }
  }

  rescheduleAllTasks(tasks: Task[]): Task[] {
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
      const scheduledTask = this.scheduleTask(task, scheduledTasks);
      scheduledTasks.push(scheduledTask);
    }
    
    return tasks.map(task => {
      const scheduled = scheduledTasks.find(st => st.id === task.id);
      return scheduled || task;
    });
  }
}

export const taskScheduler = new TaskScheduler();
