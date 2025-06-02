
import { Task } from '../types/task';
import { differenceInDays, isPast } from 'date-fns';

export type TaskStatus = 'on-time' | 'approaching' | 'overdue';

export const getTaskStatus = (task: Task, warningDays: number = 1): TaskStatus => {
  const deadline = new Date(task.deadline);
  
  // Si la tâche est terminée, elle n'est jamais en retard
  if (task.completed) {
    return 'on-time';
  }
  
  // Si la tâche a une date de planification
  if (task.scheduledStart) {
    const scheduledStart = new Date(task.scheduledStart);
    
    // Si la date de planification dépasse la deadline, c'est en retard
    if (scheduledStart > deadline) {
      return 'overdue';
    }
    
    // Calculer les jours entre la date de planification et l'échéance
    const daysUntilDeadline = differenceInDays(deadline, scheduledStart);
    
    // Si l'échéance est proche de la date de planification
    if (daysUntilDeadline <= warningDays && daysUntilDeadline >= 0) {
      return 'approaching';
    }
    
    return 'on-time';
  }
  
  // Si pas de date de planification, utiliser la date actuelle comme référence
  const now = new Date();
  
  // Si l'échéance est passée par rapport à maintenant
  if (isPast(deadline)) {
    return 'overdue';
  }
  
  // Calculer les jours entre maintenant et l'échéance
  const daysUntilDeadline = differenceInDays(deadline, now);
  
  // Si l'échéance est proche
  if (daysUntilDeadline <= warningDays && daysUntilDeadline >= 0) {
    return 'approaching';
  }
  
  return 'on-time';
};

export const getTaskStatusColors = (status: TaskStatus) => {
  switch (status) {
    case 'on-time':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        accent: 'bg-green-100',
        bgColor: '#f0fdf4',
        borderColor: '#bbf7d0'
      };
    case 'approaching':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        accent: 'bg-orange-100',
        bgColor: '#fff7ed',
        borderColor: '#fed7aa'
      };
    case 'overdue':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        accent: 'bg-red-100',
        bgColor: '#fef2f2',
        borderColor: '#fecaca'
      };
  }
};
